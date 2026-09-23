const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    message.textContent = "Logging in...";

    const loginData = {
        email: document.getElementById("email").value.trim(),
        password: document.getElementById("password").value
    };

    try {
        const response = await fetch("http://127.0.0.1:8000/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(loginData)
        });

        const data = await response.json();

        if (!response.ok) {
            if (Array.isArray(data.detail)) {
                message.textContent = data.detail
                    .map((error) => error.msg)
                    .join(", ");
            } else {
                message.textContent = data.detail || "Login failed";
            }

            return;
        }

        localStorage.setItem("athenaToken", data.token);
        localStorage.setItem("athenaUser", JSON.stringify(data));

        window.location.href = "index.html";
    } catch (error) {
        message.textContent = "Unable to connect to the Athena server";
    }
});