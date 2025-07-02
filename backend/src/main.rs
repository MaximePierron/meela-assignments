use std::env;
use log::info;
use poem::{
    EndpointExt, Route, Server,
    endpoint::{StaticFileEndpoint, StaticFilesEndpoint},
    error::ResponseError,
    get, post, delete, handler,
    http::StatusCode,
    listener::TcpListener,
    web::{Data, Json, Path},
};
use poem::middleware::Cors;
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(Debug, thiserror::Error)]
enum Error {
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error(transparent)]
    Sqlx(#[from] sqlx::Error),
    #[error(transparent)]
    Var(#[from] std::env::VarError),
    #[error(transparent)]
    Dotenv(#[from] dotenv::Error),
    #[error("Query failed")]
    QueryFailed,
    #[error("Form not found")]
    FormNotFound,
}

impl ResponseError for Error {
    fn status(&self) -> StatusCode {
        match self {
            Error::FormNotFound => StatusCode::NOT_FOUND,
            _ => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
}

async fn init_pool() -> Result<SqlitePool, Error> {
    let database_url = env::var("DATABASE_URL").unwrap_or_else(|_| "sqlite:./forms.db".to_string());
    let pool = SqlitePool::connect(&database_url).await?;
    
    // Create forms table
    sqlx::query!(
        "CREATE TABLE IF NOT EXISTS forms (
            uuid TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )"
    )
    .execute(&pool)
    .await?;
    
    Ok(pool)
}

// Original hello response
#[derive(Serialize)]
struct HelloResponse {
    hello: String,
}

// Form-related structs
#[derive(Deserialize)]
struct FormRequest {
    uuid: Option<String>,
    data: serde_json::Value,
}

#[derive(Serialize)]
struct FormResponse {
    uuid: String,
}

#[derive(Serialize)]
struct FormData {
    data: serde_json::Value,
}

#[derive(Serialize)]
struct FormListItem {
    uuid: String,
    data: serde_json::Value,
    updated_at: String,
}

#[derive(Serialize)]
struct DeleteResponse {
    message: String,
}

// Original hello handler
#[handler]
async fn hello(
    Data(pool): Data<&SqlitePool>,
    Path(name): Path<String>,
) -> Result<Json<HelloResponse>, Error> {
    let r = sqlx::query!("select 'Hello ' || $1 as hello", name)
        .fetch_one(pool)
        .await?;
    let Some(hello) = r.hello else {
        Err(Error::QueryFailed)?
    };

    Ok(Json(HelloResponse { hello }))
}

// Form handlers
#[handler]
async fn get_forms(
    Data(pool): Data<&SqlitePool>,
) -> Result<Json<Vec<FormListItem>>, Error> {
    let rows = sqlx::query!(
        "SELECT uuid, data, updated_at FROM forms ORDER BY updated_at DESC"
    )
    .fetch_all(pool)
    .await?;

    let mut forms = Vec::new();
    for row in rows {
        match serde_json::from_str::<serde_json::Value>(&row.data) {
            Ok(data) => {
                forms.push(FormListItem {
                    uuid: row.uuid.unwrap_or_default(),
                    data,
                    updated_at: row.updated_at,
                });
            }
            Err(_) => continue,
        }
    }

    Ok(Json(forms))
}

#[handler]
async fn save_form(
    Data(pool): Data<&SqlitePool>,
    Json(req): Json<FormRequest>,
) -> Result<Json<FormResponse>, Error> {
    let uuid = req.uuid.unwrap_or_else(|| Uuid::new_v4().to_string());
    let data_json = serde_json::to_string(&req.data).map_err(|_| Error::QueryFailed)?;
    let now = chrono::Utc::now().to_rfc3339();

    // Try to update first
    let result = sqlx::query!(
        "UPDATE forms SET data = $1, updated_at = $2 WHERE uuid = $3",
        data_json,
        now,
        uuid
    )
    .execute(pool)
    .await?;

    if result.rows_affected() == 0 {
        // Insert new form
        sqlx::query!(
            "INSERT INTO forms (uuid, data, updated_at) VALUES ($1, $2, $3)",
            uuid,
            data_json,
            now
        )
        .execute(pool)
        .await?;
    }

    Ok(Json(FormResponse { uuid }))
}

#[handler]
async fn get_form(
    Data(pool): Data<&SqlitePool>,
    Path(uuid): Path<String>,
) -> Result<Json<FormData>, Error> {
    let row = sqlx::query!(
        "SELECT data FROM forms WHERE uuid = $1",
        uuid
    )
    .fetch_optional(pool)
    .await?;

    match row {
        Some(row) => {
            let data: serde_json::Value = serde_json::from_str(&row.data)
                .map_err(|_| Error::QueryFailed)?;
            Ok(Json(FormData { data }))
        }
        None => Err(Error::FormNotFound),
    }
}

#[handler]
async fn delete_form(
    Data(pool): Data<&SqlitePool>,
    Path(uuid): Path<String>,
) -> Result<Json<DeleteResponse>, Error> {
    let result = sqlx::query!(
        "DELETE FROM forms WHERE uuid = $1",
        uuid
    )
    .execute(pool)
    .await?;

    if result.rows_affected() == 0 {
        Err(Error::FormNotFound)
    } else {
        Ok(Json(DeleteResponse {
            message: "Form deleted successfully".to_string(),
        }))
    }
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    let _ = dotenv::dotenv();
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));
    
    info!("Initialize db pool");
    let pool = init_pool().await?;
    let cors = Cors::new()
        .allow_origin("http://localhost:5173")
        .allow_methods(vec!["GET", "POST", "DELETE"])
        .allow_headers(vec!["content-type"]);
    
    let app = Route::new()
        // Original hello endpoint
        .at("/api/hello/:name", get(hello))
        // Form endpoints
        .at("/forms", get(get_forms))
        .at("/form", post(save_form))
        .at("/form/:uuid", get(get_form).delete(delete_form))  // Combine methods
        // Static file serving
        .at("/favicon.ico", StaticFileEndpoint::new("www/favicon.ico"))
        .nest("/static/", StaticFilesEndpoint::new("www"))
        .at("*", StaticFileEndpoint::new("www/index.html"))
        .with(cors)  // Add CORS middleware
        .data(pool);
        
    info!("Starting server on http://0.0.0.0:3005");
    Server::new(TcpListener::bind("0.0.0.0:3005"))
        .run(app)
        .await?;

    Ok(())
}