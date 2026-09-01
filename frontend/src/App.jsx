import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API = "http://localhost:5000/api";


/* =====================================================
   HELPERS
===================================================== */

function getId(item) {
  return item?.id || item?._id || null;
}


function normalizeCommitment(item) {
  if (!item) return item;

  return {
    ...item,
    id: getId(item)
  };
}


function normalizeProgress(item) {
  if (!item) return item;

  return {
    ...item,
    id: getId(item)
  };
}


const emptyForm = {
  name: "",
  description: "",
  category: "",
  frequency: "daily",
  durationDays: 30,
  startingCommitment: 100,
  escalationMultiplier: 2,
  maximumCommitment: 800,
  deadline: "21:00"
};


/* =====================================================
   NAVIGATION
===================================================== */

function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(
    new PopStateEvent("popstate")
  );
}


function usePath() {
  const [path, setPath] = useState(
    window.location.pathname || "/login"
  );

  useEffect(() => {

    const onPopState = () => {
      setPath(
        window.location.pathname || "/login"
      );
    };

    window.addEventListener(
      "popstate",
      onPopState
    );

    return () => {
      window.removeEventListener(
        "popstate",
        onPopState
      );
    };

  }, []);

  return path;
}


/* =====================================================
   SESSION
===================================================== */

function getSession() {

  try {

    return (
      JSON.parse(
        localStorage.getItem(
          "commitment_session"
        )
      ) || null
    );

  } catch {

    return null;

  }
}


function saveSession(data) {

  localStorage.setItem(
    "commitment_session",
    JSON.stringify(data)
  );

}


function clearSession() {

  localStorage.removeItem(
    "commitment_session"
  );

}


/* =====================================================
   API
===================================================== */

async function apiFetch(
  path,
  options = {}
) {

  const session = getSession();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (session?.token) {

    headers.Authorization =
      `Bearer ${session.token}`;

  }

  const response = await fetch(
    `${API}${path}`,
    {
      ...options,
      headers
    }
  );

  const data =
    await response
      .json()
      .catch(() => ({}));

  if (!response.ok) {

    throw new Error(
      data.message ||
      "Something went wrong."
    );

  }

  return data;
}


/* =====================================================
   APP
===================================================== */

function App() {

  const path = usePath();

  const session = getSession();

  useEffect(() => {

    const publicPaths = [
      "/login",
      "/signup",
      "/forgot-password",
      "/reset-password"
    ];

    if (
      !session &&
      !publicPaths.includes(path)
    ) {

      navigate("/login");

    }

    if (
      session &&
      publicPaths.includes(path)
    ) {

      navigate("/dashboard");

    }

  }, [path, session]);


  if (path === "/signup") {
    return <AuthPage mode="signup" />;
  }

  if (path === "/login") {
    return <AuthPage mode="login" />;
  }

  if (path === "/forgot-password") {
    return <ForgotPasswordPage />;
  }

  if (path === "/reset-password") {
    return <ResetPasswordPage />;
  }

  if (path === "/create") {
    return <CreatePage />;
  }

  return <DashboardPage />;
}


/* =====================================================
   BRAND
===================================================== */

function Brand() {

  return (
    <button
      className="brand"
      onClick={() =>
        navigate("/dashboard")
      }
      aria-label="Go to dashboard"
    >

      <span className="brand-star">
        ★
      </span>

      <span>
        Commitment
      </span>

    </button>
  );
}


/* =====================================================
   AUTH PAGE
===================================================== */

function AuthPage({ mode }) {

  const signup = mode === "signup";

  const [form, setForm] =
    useState({
      name: "",
      email: "",
      password: "",
      confirmPassword: ""
    });

  const [error, setError] =
    useState("");

  const [saving, setSaving] =
    useState(false);


  function change(e) {

    setForm((current) => ({
      ...current,
      [e.target.name]:
        e.target.value
    }));

  }


  async function submit(e) {

    e.preventDefault();

    setError("");


    if (
      signup &&
      form.password !==
      form.confirmPassword
    ) {

      setError(
        "Passwords do not match."
      );

      return;
    }


    if (form.password.length < 6) {

      setError(
        "Password must be at least 6 characters."
      );

      return;
    }


    setSaving(true);


    try {

      const data =
        await apiFetch(
          `/auth/${
            signup
              ? "signup"
              : "login"
          }`,
          {
            method: "POST",

            body: JSON.stringify({
              name: form.name,
              email: form.email,
              password:
                form.password
            })
          }
        );


      saveSession(data);


      navigate(
        signup
          ? "/create"
          : "/dashboard"
      );


    } catch (err) {

      setError(
        err.message
      );

    } finally {

      setSaving(false);

    }

  }


  return (
    <main className="auth-shell">

      <div className="auth-top">

        <Brand />

      </div>


      <section className="auth-card">

        <p className="eyebrow">
          {signup
            ? "Start your promise"
            : "Welcome back"}
        </p>


        <h1>
          {signup
            ? "Make a commitment that sticks."
            : "Keep your promise moving."}
        </h1>


        <p className="auth-copy">

          {signup
            ? "Create an account and put real accountability behind your habits."
            : "Sign in to see your commitments, streaks and progress."}

        </p>


        <form onSubmit={submit}>

          {signup && (
            <label>

              Name

              <input
                name="name"
                value={form.name}
                onChange={change}
                placeholder="Your name"
                required
              />

            </label>
          )}


          <label>

            Email

            <input
              name="email"
              type="email"
              value={form.email}
              onChange={change}
              placeholder="you@example.com"
              required
            />

          </label>


          <label>

            Password

            <input
              name="password"
              type="password"
              value={form.password}
              onChange={change}
              placeholder="At least 6 characters"
              required
            />

          </label>


          {signup && (
            <label>

              Confirm password

              <input
                name="confirmPassword"
                type="password"
                value={
                  form.confirmPassword
                }
                onChange={change}
                placeholder="Repeat your password"
                required
              />

            </label>
          )}


          <button
            type="submit"
            disabled={saving}
          >

            {saving
              ? "Please wait..."
              : signup
              ? "Create account"
              : "Login"}

          </button>


          {error && (
            <p className="error">
              {error}
            </p>
          )}

        </form>


        {!signup && (
          <p className="auth-switch">

            <button
              className="link-button"
              onClick={() =>
                navigate(
                  "/forgot-password"
                )
              }
            >
              Forgot password?
            </button>

          </p>
        )}


        <p className="auth-switch">

          {signup
            ? "Already have an account? "
            : "Don't have an account? "}

          <button
            className="link-button"
            onClick={() =>
              navigate(
                signup
                  ? "/login"
                  : "/signup"
              )
            }
          >

            {signup
              ? "Login"
              : "Sign up"}

          </button>

        </p>

      </section>

    </main>
  );
}


/* =====================================================
   FORGOT PASSWORD
===================================================== */

function ForgotPasswordPage() {

  const [email, setEmail] =
    useState("");

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [saving, setSaving] =
    useState(false);


  async function submit(e) {

    e.preventDefault();

    setError("");
    setMessage("");


    if (!email.trim()) {

      setError(
        "Please enter your email."
      );

      return;
    }


    setSaving(true);


    try {

      await apiFetch(
        "/auth/forgot-password",
        {
          method: "POST",

          body: JSON.stringify({
            email:
              email.trim()
          })
        }
      );


      setMessage(
        "If an account exists with this email, a password reset link has been sent."
      );


    } catch (err) {

      setError(
        err.message
      );

    } finally {

      setSaving(false);

    }

  }


  return (
    <main className="auth-shell">

      <div className="auth-top">
        <Brand />
      </div>


      <section className="auth-card">

        <p className="eyebrow">
          Account recovery
        </p>


        <h1>
          Reset your password.
        </h1>


        <p className="auth-copy">

          Enter the email connected to your
          account and we'll send you a password
          reset link.

        </p>


        {message && (
          <div className="notice">
            {message}
          </div>
        )}


        <form onSubmit={submit}>

          <label>

            Email

            <input
              name="email"
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              placeholder="you@example.com"
              required
            />

          </label>


          <button
            type="submit"
            disabled={saving}
          >

            {saving
              ? "Sending..."
              : "Send reset link"}

          </button>


          {error && (
            <p className="error">
              {error}
            </p>
          )}

        </form>


        <p className="auth-switch">

          Remember your password?{" "}

          <button
            className="link-button"
            onClick={() =>
              navigate("/login")
            }
          >
            Back to login
          </button>

        </p>

      </section>

    </main>
  );
}


/* =====================================================
   RESET PASSWORD
===================================================== */

function ResetPasswordPage() {

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [saving, setSaving] =
    useState(false);


  const token =
    new URLSearchParams(
      window.location.search
    ).get("token");


  async function submit(e) {

    e.preventDefault();

    setError("");
    setMessage("");


    if (!token) {

      setError(
        "Invalid or missing password reset token."
      );

      return;
    }


    if (password.length < 6) {

      setError(
        "Password must be at least 6 characters."
      );

      return;
    }


    if (
      password !==
      confirmPassword
    ) {

      setError(
        "Passwords do not match."
      );

      return;
    }


    setSaving(true);


    try {

      await apiFetch(
        "/auth/reset-password",
        {
          method: "POST",

          body: JSON.stringify({
            token,
            password
          })
        }
      );


      setMessage(
        "Your password has been reset successfully."
      );


      setTimeout(() => {
        navigate("/login");
      }, 1500);


    } catch (err) {

      setError(
        err.message
      );

    } finally {

      setSaving(false);

    }

  }


  return (
    <main className="auth-shell">

      <div className="auth-top">
        <Brand />
      </div>


      <section className="auth-card">

        <p className="eyebrow">
          New password
        </p>


        <h1>
          Create a new password.
        </h1>


        <p className="auth-copy">

          Choose a new password for your
          Commitment account.

        </p>


        {message && (
          <div className="notice">
            {message}
          </div>
        )}


        <form onSubmit={submit}>

          <label>

            New password

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              placeholder="At least 6 characters"
              required
            />

          </label>


          <label>

            Confirm password

            <input
              type="password"
              value={
                confirmPassword
              }
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
              placeholder="Repeat your new password"
              required
            />

          </label>


          <button
            type="submit"
            disabled={saving}
          >

            {saving
              ? "Resetting..."
              : "Reset password"}

          </button>


          {error && (
            <p className="error">
              {error}
            </p>
          )}

        </form>


        <p className="auth-switch">

          <button
            className="link-button"
            onClick={() =>
              navigate("/login")
            }
          >
            Back to login
          </button>

        </p>

      </section>

    </main>
  );
}


/* =====================================================
   CREATE COMMITMENT
===================================================== */

function CreatePage() {

  const [form, setForm] =
    useState(emptyForm);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");


  function change(e) {

    setForm((current) => ({
      ...current,
      [e.target.name]:
        e.target.value
    }));

  }


  async function submit(e) {

    e.preventDefault();

    setError("");


    if (
      !form.name ||
      !form.description ||
      !form.category
    ) {

      setError(
        "Please complete the task name, description and category."
      );

      return;
    }


    setSaving(true);


    try {

      await apiFetch(
        "/commitments",
        {
          method: "POST",

          body: JSON.stringify(
            form
          )
        }
      );


      navigate("/dashboard");


    } catch (err) {

      setError(
        err.message
      );

    } finally {

      setSaving(false);

    }

  }


  return (
    <main className="app">

      <header className="topbar">

        <Brand />

        <button
          className="secondary-button"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          Dashboard
        </button>

      </header>


      <header className="header">

        <p className="eyebrow">
          Create commitment
        </p>


        <h1>
          Build a promise that matters.
        </h1>


        <p className="subtitle">

          Create your task, choose your commitment,
          and make progress you can prove.

        </p>

      </header>


      <section className="layout">

        <form
          className="card form-card"
          onSubmit={submit}
        >

          <div className="section-heading">

            <div>

              <p className="eyebrow">
                Create
              </p>

              <h2>
                Your commitment
              </h2>

            </div>

          </div>


          <label>

            Task name

            <input
              name="name"
              value={form.name}
              onChange={change}
              placeholder="Example: Study DSA for 1 hour"
            />

          </label>


          <label>

            Description

            <textarea
              name="description"
              value={form.description}
              onChange={change}
              placeholder="Describe exactly what you will complete"
              rows="4"
            />

          </label>


          <label>

            Category

            <input
              name="category"
              value={form.category}
              onChange={change}
              placeholder="Example: Learning, Health, Work"
            />

          </label>


          <div className="two-columns">

            <label>

              Frequency

              <select
                name="frequency"
                value={form.frequency}
                onChange={change}
              >

                <option value="daily">
                  Daily
                </option>

                <option value="weekdays">
                  Weekdays
                </option>

                <option value="weekly">
                  Weekly
                </option>

              </select>

            </label>


            <label>

              Duration in days

              <input
                name="durationDays"
                type="number"
                min="1"
                value={
                  form.durationDays
                }
                onChange={change}
              />

            </label>

          </div>


          <div className="two-columns">

            <label>

              Starting commitment

              <input
                name="startingCommitment"
                type="number"
                min="1"
                value={
                  form.startingCommitment
                }
                onChange={change}
              />

            </label>


            <label>

              Escalation multiplier

              <input
                name="escalationMultiplier"
                type="number"
                min="1"
                step="0.5"
                value={
                  form.escalationMultiplier
                }
                onChange={change}
              />

            </label>

          </div>


          <div className="two-columns">

            <label>

              Maximum commitment

              <input
                name="maximumCommitment"
                type="number"
                min="1"
                value={
                  form.maximumCommitment
                }
                onChange={change}
              />

            </label>


            <label>

              Daily deadline

              <input
                name="deadline"
                type="time"
                value={
                  form.deadline
                }
                onChange={change}
              />

            </label>

          </div>


          <button
            type="submit"
            disabled={saving}
          >

            {saving
              ? "Creating..."
              : "Create commitment"}

          </button>


          {error && (
            <p className="error">
              {error}
            </p>
          )}

        </form>


        <aside className="card example-card">

          <p className="eyebrow">
            Example
          </p>


          <h2>
            What makes a good task?
          </h2>


          <div className="example-box">

            <strong>
              Study DSA for 1 hour
            </strong>

            <p>
              Complete one focused hour of
              algorithm practice.
            </p>

          </div>


          <ul>

            <li>
              Make it specific
            </li>

            <li>
              Make it measurable
            </li>

            <li>
              Make it possible to prove
            </li>

          </ul>


          <p className="muted">

            Your daily progress will be stored
            so the dashboard can show your
            contribution history.

          </p>

        </aside>

      </section>

    </main>
  );
}


/* =====================================================
   DASHBOARD
===================================================== */

function DashboardPage() {

  const [commitments, setCommitments] =
    useState([]);

  const [selectedId, setSelectedId] =
    useState(null);

  const [detail, setDetail] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  /* PROOF */

  const [proofFile, setProofFile] =
    useState(null);

  const [proofUploading, setProofUploading] =
    useState(false);

  const [proofMessage, setProofMessage] =
    useState("");

  const [proofUploaded, setProofUploaded] =
    useState(false);


  /* AI */

  const [aiChallenge, setAiChallenge] =
    useState("");

  const [challengeLoading, setChallengeLoading] =
    useState(false);


  /* SUBMISSION */

  const [submitting, setSubmitting] =
    useState(false);


  /* PAYMENT */

  const [paymentLoading, setPaymentLoading] =
    useState(false);

  const [paymentResult, setPaymentResult] =
    useState(null);


  const session = getSession();


  /* ===================================================
     LOAD COMMITMENTS
  =================================================== */

  async function loadCommitments() {

    try {

      setError("");

      const data =
        await apiFetch(
          "/commitments"
        );


      const list =
        (data.commitments || [])
          .map(
            normalizeCommitment
          );


      setCommitments(list);


      setSelectedId((current) => {

        if (
          current &&
          list.some(
            (item) =>
              getId(item) ===
              current
          )
        ) {

          return current;

        }

        return getId(list[0]);

      });


    } catch (err) {

      setError(
        err.message
      );

    } finally {

      setLoading(false);

    }

  }


  /* ===================================================
     LOAD DETAIL
  =================================================== */

  async function loadDetail(id) {

    if (!id) {

      setDetail(null);

      return;

    }


    try {

      setError("");


      const data =
        await apiFetch(
          `/commitments/${id}`
        );


      const normalizedProgress =
        (data.progress || [])
          .map(
            normalizeProgress
          );


      setDetail({

        ...data,

        commitment:
          normalizeCommitment(
            data.commitment
          ),

        progress:
          normalizedProgress

      });


      /*
      Check whether today's proof
      has already been submitted.
      */

      const today =
        new Date()
          .toISOString()
          .slice(0, 10);


      const todayRecord =
        normalizedProgress.find(
          (item) =>
            item.date ===
            today
        );


      /*
      Only a completed progress record
      counts as today's submission.
      */

      if (
        todayRecord &&
        todayRecord.status ===
          "completed"
      ) {

        setProofUploaded(true);

      } else {

        /*
        If no completed record exists,
        proofUploaded should be false
        unless the user has just verified
        a new image.
        */

      }


    } catch (err) {

      setError(
        err.message
      );

    }

  }


  useEffect(() => {

    loadCommitments();

  }, []);


  useEffect(() => {

    if (!selectedId) {

      setDetail(null);

      return;

    }


    loadDetail(
      selectedId
    );

    setProofFile(null);

    setProofMessage("");

    setProofUploaded(false);

    setPaymentResult(null);

  }, [selectedId]);


  useEffect(() => {

    loadAIChallenge(
      selectedId
    );

  }, [selectedId]);


  /* ===================================================
     AI CHALLENGE
  =================================================== */

  async function loadAIChallenge(id) {

    if (!id) {

      setAiChallenge("");

      return;

    }


    setChallengeLoading(true);


    try {

      const data =
        await apiFetch(
          `/commitments/${id}/today-challenge`
        );


      setAiChallenge(
        data.challenge || ""
      );


    } catch (err) {

      /*
      Application continues even if
      AI challenge generation fails.
      */

      setAiChallenge(
        "Complete today's commitment and provide genuine proof of your work."
      );

    } finally {

      setChallengeLoading(false);

    }

  }


  /* ===================================================
     UPLOAD + AI VERIFY PROOF
  =================================================== */

  async function uploadProof() {

    if (!proofFile) {

      setProofMessage(
        "Please choose an image first."
      );

      return;

    }


    if (!selectedId) {

      setProofMessage(
        "Please select a commitment first."
      );

      return;

    }


    setProofUploading(true);

    setProofMessage("");

    /*
    VERY IMPORTANT:
    Submit must remain disabled
    until AI returns verified=true.
    */

    setProofUploaded(false);


    try {

      const formData =
        new FormData();


      formData.append(
        "proof",
        proofFile
      );


      formData.append(
        "commitmentId",
        selectedId
      );


      const session =
        getSession();


      const response =
        await fetch(
          `${API}/proof/upload`,
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${session?.token}`
            },

            body: formData
          }
        );


      const data =
        await response
          .json()
          .catch(() => ({}));


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Proof verification failed."
        );

      }


      /*
      ==============================================
      AI VERIFICATION CHECK
      ==============================================
      */

      if (!data.verified) {

        setProofUploaded(false);

        setProofMessage(
          `❌ Proof rejected: ${
            data.reason ||
            "The image does not provide sufficient evidence."
          }`
        );

        return;

      }


      /*
      ==============================================
      VERIFIED
      ==============================================
      */

      setProofUploaded(true);


      setProofMessage(
        `✅ Image verified successfully.${
          data.reason
            ? ` ${data.reason}`
            : ""
        }`
      );


      setProofFile(null);


      await loadDetail(
        selectedId
      );


    } catch (err) {

      setProofUploaded(false);

      setProofMessage(
        err.message
      );

    } finally {

      setProofUploading(false);

    }

  }


  /* ===================================================
     SUBMIT + PAYMENT
  =================================================== */

  async function submitToday() {

    if (!selectedId) {
      return;
    }


    /*
    NEVER allow submission without
    successful AI verification.
    */

    if (!proofUploaded) {

      setProofMessage(
        "Please upload and verify the proof image first."
      );

      return;

    }


    setSubmitting(true);

    setError("");

    setPaymentResult(null);


    try {

      /* ================================================
         STEP 1 — SUBMIT TODAY'S COMMITMENT
      ================================================= */

      const data =
        await apiFetch(
          `/commitments/${selectedId}/progress`,
          {
            method: "POST",

            body: JSON.stringify({
              status:
                "completed"
            })
          }
        );


      /*
      Update detail immediately.
      */

      setDetail((current) => ({

        commitment:
          normalizeCommitment(
            data.commitment
          ),

        progress: [
          ...(current?.progress || []),

          normalizeProgress(
            data.progress
          )

        ]

      }));


      /*
      Update commitment list.
      */

      setCommitments((current) =>
        current.map((item) =>

          getId(item) ===
          getId(data.commitment)

            ? normalizeCommitment(
                data.commitment
              )

            : item

        )
      );


      /* ================================================
         STEP 2 — TEST PAYMENT
      ================================================= */

      setPaymentLoading(true);


      const paymentAmount =
        Number(
          data.commitment
            ?.currentCommitment
        ) ||

        Number(
          commitment
            ?.currentCommitment
        ) ||

        0;


      const payment =
        await apiFetch(
          "/payment/test-payment",
          {
            method: "POST",

            body: JSON.stringify({

              commitmentId:
                selectedId,

              amount:
                paymentAmount

            })
          }
        );


      /*
      Store payment result
      so it appears on dashboard.
      */

      setPaymentResult(
        payment
      );


      /*
      Proof has already been used.
      */

      setProofUploaded(
        false
      );


      setProofMessage(
        "✅ Commitment submitted and test payment recorded successfully."
      );


    } catch (err) {

      setError(
        err.message
      );


    } finally {

      setSubmitting(false);

      setPaymentLoading(false);

    }

  }


  /* ===================================================
     LOGOUT
  =================================================== */

  function logout() {

    clearSession();

    navigate("/login");

  }


  /* ===================================================
     DATA
  =================================================== */

  const commitment =
    detail?.commitment;


  const progress =
    detail?.progress || [];


  /*
  ONLY COMPLETED RECORDS COUNT.
  */

  const completed =
    progress.filter(
      (item) =>
        item.status ===
        "completed"
    ).length;


  const duration =
    Number(
      commitment?.durationDays
    ) || 0;


  /*
  Progress percentage.
  */

  const progressPercent =
    duration
      ? Math.min(
          100,
          Math.round(
            (completed / duration) *
            100
          )
        )
      : 0;


  const currentStreak =
    Number(
      commitment?.currentStreak
    ) || 0;


  const bestStreak =
    Number(
      commitment?.longestStreak
    ) || 0;


  const today =
    new Date()
      .toISOString()
      .slice(0, 10);


  const todayRecord =
    progress.find(
      (item) =>
        item.date === today
    );


  /* ===================================================
     CORRECT ACTIVE DAY
  =================================================== */

  /*
  Before first submission:
      Day 1 of 30

  After 1 completion:
      Day 1 of 30

  After 5 completions:
      Day 5 of 30

  We NEVER show completed + 1
  as the current active day.
  */

  const activeDay =
    Math.min(
      duration || 1,
      Math.max(
        1,
        completed
      )
    );


  function getStreakMessage() {

    if (currentStreak === 0) {

      return "Start your streak today.";

    }


    if (currentStreak <= 2) {

      return "You're getting started.";

    }


    if (currentStreak <= 6) {

      return "You're building momentum.";

    }


    return "You're on fire.";

  }


  /* ===================================================
     RETURN DASHBOARD
  =================================================== */

  return (
    <main className="app dashboard-page">

      {/* ================================================
          TOP BAR
      ================================================= */}

      <header className="topbar">

        <Brand />


        <div className="topbar-actions">

          <span className="user-chip">

            Hi,{" "}
            {session?.user?.name}

          </span>


          <button
            className="secondary-button"
            onClick={() =>
              navigate("/create")
            }
          >
            + New commitment
          </button>


          <button
            className="logout-button"
            onClick={logout}
          >
            Logout
          </button>

        </div>

      </header>


      {/* ================================================
          HERO
      ================================================= */}

      <header className="dashboard-hero">

        <div>

          <p className="eyebrow">
            Your dashboard
          </p>


          <h1>
            Keep the promise moving.
          </h1>


          <p className="subtitle">

            Every completed day becomes part
            of your proof.

          </p>

        </div>


        <div className="star-badge">
          ★
        </div>

      </header>


      {/* ERROR */}

      {error && (
        <div className="notice error">
          {error}
        </div>
      )}


      {/* LOADING */}

      {loading && (
        <p>
          Loading your commitments...
        </p>
      )}


      {/* EMPTY */}

      {!loading &&
        commitments.length === 0 && (

          <div className="card empty-state">

            <h2>
              No commitment yet
            </h2>


            <p>

              Create your first commitment
              and start building your streak.

            </p>


            <button
              onClick={() =>
                navigate("/create")
              }
            >
              Create commitment
            </button>

          </div>

        )}


      {/* COMMITMENTS */}

      {commitments.length > 0 && (

        <>

          {/* ============================================
              COMMITMENT TABS
          ============================================ */}

          <div className="commitment-tabs">

            {commitments.map(
              (item) => {

                const itemId =
                  getId(item);


                return (

                  <button
                    key={itemId}
                    className={
                      itemId ===
                      selectedId
                        ? "tab active"
                        : "tab"
                    }
                    onClick={() =>
                      setSelectedId(
                        itemId
                      )
                    }
                  >

                    {item.name}

                  </button>

                );

              }
            )}

          </div>


          {commitment && (

            <>

              {/* ========================================
                  STREAK
              ======================================== */}

              <section className="card streak-hero-card">

                <div className="streak-fire">
                  🔥
                </div>


                <div className="streak-main">

                  <p className="eyebrow">
                    Current streak
                  </p>


                  <div className="streak-number">

                    {currentStreak}

                  </div>


                  <strong>
                    DAY STREAK
                  </strong>


                  <p>
                    {getStreakMessage()}
                  </p>

                </div>


                <div className="best-streak-box">

                  <span>
                    🏆 Best streak
                  </span>


                  <strong>
                    {bestStreak}
                  </strong>


                  <small>
                    days
                  </small>

                </div>

              </section>


              {/* ========================================
                  STATS
              ======================================== */}

              <section className="stats-grid">

                <div className="card stat-card">

                  <span>
                    Completed
                  </span>


                  <strong>
                    {completed}/{duration}
                  </strong>


                  <small>
                    {progressPercent}%
                    of commitment
                  </small>

                </div>


                <div className="card stat-card">

                  <span>
                    Active day
                  </span>


                  <strong>
                    Day {activeDay}
                  </strong>


                  <small>
                    of {duration} days
                  </small>

                </div>


                <div className="card stat-card">

                  <span>
                    Current commitment
                  </span>


                  <strong>
                    ₹
                    {
                      commitment.currentCommitment
                    }
                  </strong>


                  <small>
                    Maximum ₹
                    {
                      commitment.maximumCommitment
                    }
                  </small>

                </div>

              </section>


              {/* ========================================
                  TODAY'S TASK
              ======================================== */}

              <section className="card today-task-card">

                <div className="today-task-header">

                  <div>

                    <p className="eyebrow">
                      Today's task
                    </p>


                    <h2>
                      {commitment.name}
                    </h2>

                  </div>

                </div>


                <p className="today-task-description">

                  {commitment.description}

                </p>


                {/* ======================================
                    AI CHALLENGE
                ====================================== */}

                <div className="ai-challenge-box">

                  <div className="ai-icon">
                    🤖
                  </div>


                  <div>

                    <strong>
                      Today's AI Challenge
                    </strong>


                    {challengeLoading ? (

                      <p>
                        Creating today's challenge...
                      </p>

                    ) : (

                      <p>

                        {aiChallenge ||
                          "Complete today's commitment and provide genuine proof of your work."}

                      </p>

                    )}


                    <small>

                      Your challenge is based on
                      this commitment.

                    </small>

                  </div>

                </div>


                {/* ======================================
                    PROOF
                ====================================== */}

                {!todayRecord && (

                  <div className="task-proof-area">

                    <p className="proof-title">

                      📸 Proof of today's work

                    </p>


                    <label className="proof-upload">

                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {

                          setProofFile(
                            e.target.files?.[0] ||
                            null
                          );

                          setProofMessage(
                            ""
                          );

                          /*
                          New image must be
                          verified again.
                          */

                          setProofUploaded(
                            false
                          );

                        }}
                      />


                      <span>

                        {proofFile

                          ? `📷 ${proofFile.name}`

                          : "Choose today's proof image"}

                      </span>

                    </label>


                    <button
                      type="button"
                      onClick={
                        uploadProof
                      }
                      disabled={
                        !proofFile ||
                        proofUploading
                      }
                    >

                      {proofUploading
                        ? "AI is verifying..."
                        : "Upload & Verify Proof"}

                    </button>


                    {proofMessage && (

                      <p
                        className={
                          proofUploaded
                            ? "proof-success"
                            : "muted"
                        }
                      >

                        {proofMessage}

                      </p>

                    )}


                    {/* =================================
                        SUBMIT
                    ================================= */}

                    <button
                      type="button"
                      className="submit-button"
                      onClick={
                        submitToday
                      }
                      disabled={
                        !proofUploaded ||
                        submitting ||
                        paymentLoading
                      }
                    >

                      {submitting

                        ? "Submitting..."

                        : paymentLoading

                        ? "Processing test payment..."

                        : "Submit & Record Payment"}

                    </button>


                    {!proofUploaded && (
                      <small className="submit-hint">

                        Submit becomes available
                        only after AI verifies
                        your proof image.

                      </small>
                    )}

                  </div>

                )}


                {/* ======================================
                    ALREADY SUBMITTED
                ====================================== */}

                {todayRecord && (

                  <div className="today-recorded">

                    ✅ Today's commitment has
                    already been submitted.

                  </div>

                )}


                {/* ======================================
                    PAYMENT RESULT
                ====================================== */}

                {paymentResult && (

                  <div className="payment-success-card">

                    <div className="payment-icon">
                      💳
                    </div>


                    <div className="payment-content">

                      <p className="eyebrow">
                        Test transaction
                      </p>


                      <h3>
                        Payment recorded successfully
                      </h3>


                      <p>

                        No real money was transferred.
                        This is a demonstration transaction.

                      </p>


                      <div className="payment-details">

                        <div>

                          <span>
                            Amount
                          </span>


                          <strong>

                            ₹
                            {
                              paymentResult.amount
                            }

                          </strong>

                        </div>


                        <div>

                          <span>
                            Status
                          </span>


                          <strong>

                            ✓{" "}
                            {
                              paymentResult.paymentStatus
                            }

                          </strong>

                        </div>


                        <div>

                          <span>
                            Transaction ID
                          </span>


                          <strong>

                            {
                              paymentResult.transactionId
                            }

                          </strong>

                        </div>

                      </div>

                    </div>

                  </div>

                )}

              </section>


              {/* ========================================
                  MAIN CONTENT
              ======================================== */}

              <section className="dashboard-grid">

                {/* DETAILS */}

                <article className="card commitment-card">

                  <div className="card-header">

                    <div>

                      <p className="category">
                        {commitment.category}
                      </p>


                      <h2>
                        {commitment.name}
                      </h2>

                    </div>


                    <span className="status">

                      {commitment.status}

                    </span>

                  </div>


                  <p className="description">

                    {commitment.description}

                  </p>


                  <div className="progress-row">

                    <div>

                      <strong>

                        Day{" "}
                        {activeDay}{" "}
                        of {duration}

                      </strong>


                      <span>

                        {progressPercent}%
                        complete

                      </span>

                    </div>


                    <div className="progress-track">

                      <div
                        className="progress-fill"
                        style={{
                          width:
                            `${progressPercent}%`
                        }}
                      />

                    </div>

                  </div>


                  <div className="commitment-meta">

                    <span>

                      Daily deadline

                      <strong>
                        {commitment.deadline}
                      </strong>

                    </span>


                    <span>

                      Escalation

                      <strong>

                        ×
                        {
                          commitment.escalationMultiplier
                        }

                      </strong>

                    </span>


                    <span>

                      Maximum

                      <strong>

                        ₹
                        {
                          commitment.maximumCommitment
                        }

                      </strong>

                    </span>

                  </div>

                </article>


                {/* ======================================
                    GRAPH
                ====================================== */}

                <article className="card graph-card">

                  <div className="card-header">

                    <div>

                      <p className="eyebrow">
                        Activity
                      </p>


                      <h2>
                        Contribution history
                      </h2>

                    </div>


                    <span className="graph-value">

                      {completed} days

                    </span>

                  </div>


                  <ContributionGraph
                    duration={duration}
                    progress={progress}
                  />

                </article>

              </section>


              {/* ========================================
                  HISTORY
              ======================================== */}

              <section className="card history-card">

                <div className="card-header">

                  <div>

                    <p className="eyebrow">
                      Daily records
                    </p>


                    <h2>
                      Your proof history
                    </h2>

                  </div>


                  <span className="count">

                    {progress.length}
                    {" "}
                    recorded

                  </span>

                </div>


                <div className="history-list">

                  {progress
                    .slice()
                    .reverse()
                    .map((item) => (

                      <div
                        className="history-row"
                        key={
                          getId(item) ||
                          item.date
                        }
                      >

                        <span>
                          {item.date}
                        </span>


                        <span
                          className={
                            item.status ===
                            "completed"

                              ? "success-pill"

                              : "miss-pill"
                          }
                        >

                          {item.status ===
                          "completed"

                            ? "✓ Completed"

                            : "✕ Missed"}

                        </span>


                        <strong>

                          ₹
                          {
                            item.commitmentAmount
                          }

                        </strong>


                        <small>

                          🔥{" "}
                          {item.streak}
                          {" "}
                          day streak

                        </small>

                      </div>

                    ))}


                  {progress.length === 0 && (

                    <p className="muted">

                      No daily records yet.
                      Submit today's commitment
                      to start your history.

                    </p>

                  )}

                </div>

              </section>

            </>

          )}

        </>

      )}

    </main>
  );
}


/* =====================================================
   CONTRIBUTION GRAPH
===================================================== */

function ContributionGraph({
  duration,
  progress
}) {

  /*
  Always create at least 30 boxes.
  */

  const days =
    Math.max(
      Number(duration) || 30,
      30
    );


  const progressMap =
    useMemo(() => {

      const map = {};

      progress.forEach(
        (item) => {

          map[item.date] =
            item.status;

        }
      );

      return map;

    }, [progress]);


  /*
  Find the earliest recorded date.
  */

  const startDate =
    useMemo(() => {

      if (
        progress.length > 0
      ) {

        const sorted =
          progress
            .slice()
            .sort(
              (a, b) =>
                new Date(a.date) -
                new Date(b.date)
            );


        const firstDate =
          new Date(
            `${sorted[0].date}T00:00:00`
          );


        /*
        Start graph from the first
        commitment record.
        */

        return firstDate;

      }


      /*
      If no progress exists,
      show a full empty graph ending today.
      */

      const date =
        new Date();


      date.setDate(
        date.getDate() -
        (days - 1)
      );


      return date;

    }, [progress, days]);


  /*
  Generate every box.
  */

  const cells =
    Array.from(
      {
        length: days
      },
      (_, index) => {

        const date =
          new Date(
            startDate
          );


        date.setDate(
          startDate.getDate() +
          index
        );


        const key =
          date
            .toISOString()
            .slice(0, 10);


        return {

          date: key,

          status:
            progressMap[key] ||
            "empty"

        };

      }
    );


  return (

    <div className="contribution-wrapper">

      <div className="contribution-grid">

        {cells.map(
          (cell) => (

            <div
              key={cell.date}
              className={
                cell.status ===
                "completed"

                  ? "contribution-cell completed"

                  : "contribution-cell"
              }
              title={
                cell.status ===
                "completed"

                  ? `${cell.date} — Completed`

                  : `${cell.date} — No submission`
              }
            />

          )
        )}

      </div>


      <div className="contribution-footer">

        <span>
          Less
        </span>


        <div className="legend-cell" />


        <div className="legend-cell active" />


        <span>
          More
        </span>

      </div>


      <p className="graph-note">

        Your daily submissions will appear
        here as activity.

      </p>

    </div>

  );
}


export default App;
