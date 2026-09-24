const category = document.getElementById("category");
const role = document.getElementById("role");
const signupForm = document.getElementById("signupForm");
const message = document.getElementById("message");

const roles = {
    Software: ["Machine Learning", "Software Engineer"],
    Agriculture: ["Farmer", "Agricultural Engineer"],
    Healthcare: ["Doctor", "Pharmacist"]
};

category.addEventListener("change", () => {
    role.innerHTML = '<option value="">Select role</option>';

    if (!category.value) {
        return;
    }

    roles[category.value].forEach((item) => {
        const option = document.createElement("option");
        option.value = item;
        option.textContent = item;
        role.appendChild(option);
    });
});

signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    message.textContent = "Creating account...";

    const userData = {
        full_name: document.getElementById("fullName").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim() || null,
        password: document.getElementById("password").value,
        confirm_password: document.getElementById("confirmPassword").value,
        category: category.value,
        role: role.value
    };

    try {
        const response = await fetch("https://athena-nf7s.onrender.com/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (!response.ok) {
            if (Array.isArray(data.detail)) {
                message.textContent = data.detail
                    .map((error) => error.msg)
                    .join(", ");
            } else {
                message.textContent = data.detail || "Registration failed";
            }

            return;
        }

        message.textContent = data.message;
        signupForm.reset();
        role.innerHTML = '<option value="">Select role</option>';
    } catch (error) {
        message.textContent = "Unable to connect to the Athena server";
    }
});