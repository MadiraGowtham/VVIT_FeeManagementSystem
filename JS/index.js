document.querySelector("form").addEventListener("submit", function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (username === "" || password === "") {
        alert("⚠️ Please enter both username and password.");
        return;
    }

    fetch(`http://localhost:3000/users?username=${username}&password=${password}`)
        .then(res => res.json())
        .then(data => {
            if (data.length === 1) {
                const user = data[0];
                alert("✅ Login Successful!");

                // Store logged-in user data if needed
                localStorage.setItem("loggedInUser", JSON.stringify(user));

                // Redirect based on user type
                if (user.type === "student") {
                    window.location.href = "studentIndex.html";
                } else if (user.type === "admin") {
                    window.location.href = "adminIndex.html";
                } else {
                    alert("⚠️ Unknown user type.");
                }
            } else {
                alert("❌ Invalid Username or Password");
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("🚫 Server error. Please try again later.");
        });
});