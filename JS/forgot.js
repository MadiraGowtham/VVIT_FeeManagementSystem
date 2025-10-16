const apiUrl = "https://json-server-api-3-xhbm.onrender.com/users"; // change if your JSON Server runs elsewhere

  document.getElementById("forgotPasswordForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const originalPassword = document.getElementById("originalPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const messageDiv = document.getElementById("message");

    messageDiv.className = "";
    messageDiv.textContent = "";

    if (newPassword !== confirmPassword) {
      messageDiv.className = "error";
      messageDiv.textContent = "New passwords do not match.";
      return;
    }

    try {
      const response = await fetch(`${apiUrl}?username=${encodeURIComponent(username)}`);
      const users = await response.json();

      if (users.length === 0) {
        messageDiv.className = "error";
        messageDiv.textContent = "User not found.";
        return;
      }

      const user = users[0];

      if (user.password !== originalPassword) {
        messageDiv.className = "error";
        messageDiv.textContent = "Original password is incorrect.";
        return;
      }

      const updateRes = await fetch(`${apiUrl}/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ password: newPassword })
      });

      if (updateRes.ok) {
        messageDiv.className = "success";
        messageDiv.textContent = "Password updated successfully.";
        // Optionally redirect to login after delay
        // setTimeout(() => window.location.href = "login.html", 1500);
      } else {
        throw new Error("Failed to update password.");
      }

    } catch (err) {
      console.error(err);
      messageDiv.className = "error";
      messageDiv.textContent = "Something went wrong. Please try again.";
    }
  });
