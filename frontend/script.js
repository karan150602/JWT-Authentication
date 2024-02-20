document.getElementById("signupForm").addEventListener("submit", signup);
document.getElementById("loginForm").addEventListener("submit", login);

function signup(event) {
  event.preventDefault();

  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  axios
    .post("/api/auth/signup", { email, password })
    .then((response) => {
      document.getElementById("message").innerHTML =
        '<div class="success">Signup successful. You can now login.</div>';
    })
    .catch((error) => {
      document.getElementById(
        "message"
      ).innerHTML = `<div id="error">${error.response.data.email}</div>`;
    });
}
 
function login(event) {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  axios
    .post("/api/auth/login", { email, password })
    .then((response) => {
      const token = response.data.token;
      localStorage.setItem("jwtToken", token);
      window.location.href = "/dashboard.html"; // Redirect to dashboard page after successful login
    })
    .catch((error) => {
      document.getElementById(
        "message"
      ).innerHTML = `<div id="error">${error.response.data.password}</div>`;
    });
}
