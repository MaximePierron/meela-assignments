import React, { useState, useEffect } from "react";
import {
  useParams,
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  Link,
} from "react-router-dom";
import axios from "axios";

const steps = [
  {
    name: "Basic Info",
    questions: ["What is your name?", "What is your age?"],
  },
  { name: "Preferences", questions: ["What are you looking for in therapy?"] },
  { name: "Experience", questions: ["Have you seen a therapist before?"] },
];

function LandingPage() {
  const [forms, setForms] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:3005/forms")
      .then((res) => setForms(res.data))
      .catch(console.error);
  }, []);

  const deleteForm = async (uuid) => {
    if (confirm("Delete this questionnaire?")) {
      await axios.delete(`http://localhost:3005/form/${uuid}`);
      setForms(forms.filter((f) => f.uuid !== uuid));
    }
  };

  const getProgress = (data) => {
    const total = steps.reduce((sum, step) => sum + step.questions.length, 0);
    const answered = Object.keys(data).filter((k) => data[k]?.trim()).length;
    return Math.round((answered / total) * 100);
  };

  const getTitle = (data) => {
    const name = data["0-0"];
    const age = data["0-1"];
    return name ? `${name}${age ? ` (${age})` : ""}` : "Unnamed";
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Therapy Questionnaires</h1>

      <button
        onClick={() => navigate("/form")}
        style={{
          padding: "12px 24px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "6px",
          marginBottom: "20px",
        }}
      >
        New Questionnaire
      </button>

      <h2>Saved ({forms.length})</h2>

      {forms.length === 0 ? (
        <p>No questionnaires yet.</p>
      ) : (
        forms.map((form) => {
          const progress = getProgress(form.data);
          return (
            <div
              key={form.uuid}
              style={{
                border: "1px solid #ddd",
                padding: "16px",
                marginBottom: "12px",
                borderRadius: "6px",
              }}
            >
              <h3>{getTitle(form.data)}</h3>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    height: "8px",
                    backgroundColor: "#eee",
                    borderRadius: "4px",
                  }}
                >
                  <div
                    style={{
                      width: `${progress}%`,
                      height: "100%",
                      backgroundColor: progress === 100 ? "#28a745" : "#007bff",
                      borderRadius: "4px",
                    }}
                  />
                </div>
                <span>{progress}%</span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <Link
                  to={`/form/${form.uuid}`}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#007bff",
                    color: "white",
                    textDecoration: "none",
                    borderRadius: "4px",
                  }}
                >
                  {progress === 100 ? "View" : "Continue"}
                </Link>
                <button
                  onClick={() => deleteForm(form.uuid)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function Form() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({});
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (uuid) {
      axios
        .get(`http://localhost:3005/form/${uuid}`)
        .then((res) => setFormData(res.data.data))
        .catch(() => navigate("/form"));
    }
  }, [uuid, navigate]);

  const save = async () => {
    const res = await axios.post("http://localhost:3005/form", {
      uuid,
      data: formData,
    });
    if (!uuid) navigate(`/form/${res.data.uuid}`);
  };

  const isComplete = () => {
    const total = steps.reduce((sum, step) => sum + step.questions.length, 0);
    return (
      Object.keys(formData).filter((k) => formData[k]?.trim()).length === total
    );
  };

  const step = steps[stepIndex];

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <Link to="/">← Back</Link>

      <h1>Therapy Questionnaire</h1>
      <p>
        Step {stepIndex + 1} of {steps.length}
      </p>

      <div
        style={{
          width: "100%",
          height: "6px",
          backgroundColor: "#eee",
          borderRadius: "3px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            width: `${((stepIndex + 1) / steps.length) * 100}%`,
            height: "100%",
            backgroundColor: "#007bff",
            borderRadius: "3px",
          }}
        />
      </div>

      <h2>{step.name}</h2>
      {step.questions.map((q, i) => (
        <div key={i} style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "4px" }}>{q}</label>
          <input
            type="text"
            value={formData[`${stepIndex}-${i}`] || ""}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                [`${stepIndex}-${i}`]: e.target.value,
              }))
            }
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
        </div>
      ))}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "20px",
        }}
      >
        <button
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          disabled={stepIndex === 0}
          style={{
            padding: "8px 16px",
            backgroundColor: stepIndex === 0 ? "#eee" : "#6c757d",
            color: stepIndex === 0 ? "#999" : "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Back
        </button>

        <button
          onClick={save}
          style={{
            padding: "8px 16px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Save
        </button>

        <button
          onClick={() => setStepIndex((i) => Math.min(steps.length - 1, i + 1))}
          disabled={stepIndex === steps.length - 1}
          style={{
            padding: "8px 16px",
            backgroundColor:
              stepIndex === steps.length - 1 ? "#eee" : "#007bff",
            color: stepIndex === steps.length - 1 ? "#999" : "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Next
        </button>
      </div>

      {isComplete() && (
        <div
          style={{
            marginTop: "20px",
            padding: "16px",
            backgroundColor: "#d4edda",
            border: "1px solid #c3e6cb",
            borderRadius: "6px",
            color: "#155724",
          }}
        >
          <strong>Questionnaire Complete!</strong>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/form" element={<Form />} />
        <Route path="/form/:uuid" element={<Form />} />
      </Routes>
    </Router>
  );
}
