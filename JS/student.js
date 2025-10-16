document.addEventListener("DOMContentLoaded", () => {
  const admin = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!admin || admin.type !== "admin") {
    alert("Unauthorized access!");
    window.location.href = "index.html";
    return;
  }

  showStudents();
  setupBranchSelector();
});

function logout() {
  localStorage.removeItem("loggedInUser");
  window.location.href = "index.html";
}

async function setupBranchSelector() {
  const branchSelect = document.getElementById("branch1");
  const studentContainer = document.getElementById("students1");
  const dataContainer = document.getElementById("data");

  branchSelect.addEventListener("change", async () => {
    const branch = branchSelect.value;
    studentContainer.innerHTML = "";
    dataContainer.innerHTML = "";

    if (branch === "Select Branch") return;

    try {
      const res = await fetch("https://json-server-api-3-xhbm.onrender.com/users?type=student");
      const users = await res.json();
      const filtered = users.filter(user => user.branch === branch);

      if (filtered.length === 0) {
        studentContainer.innerHTML = "<p>No students in this branch.</p>";
        return;
      }

      const select = document.createElement("select");
      select.id = "studentSelect1";
      select.innerHTML = `<option value="">Select Student</option>`;

      filtered.forEach(user => {
        const option = document.createElement("option");
        option.value = user.id;
        option.innerText = user.name + " (" + user.id + ")";
        select.appendChild(option);
      });

      studentContainer.appendChild(select);

      // Student selection listener
      select.addEventListener("change", async (e) => {
        const studentId = e.target.value;
        dataContainer.innerHTML = "";

        if (!studentId) return;

        try {
          const res = await fetch(`https://json-server-api-3-xhbm.onrender.com/users?id=${studentId}`);
          const students = await res.json();
          const student = students[0];

          if (student && student.type === "student") {
            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
              <div class="info">
                <p><b>Name :</b> ${student.name}</p>
                <p><b>ID :</b> ${student.id}</p>
              </div>
              <p><b>Email :</b> ${student.username}</p>
              <p><b>Branch :</b> ${student.branch}</p>
              <p><b>Semester :</b> ${student.currentSemester}</p>
              <div class="buttons">
                <button onclick="editStudent('${student.id}')">Edit</button>
                <button onclick="deleteStudent('${student.id}')">Delete</button>
              </div>
            `;
            dataContainer.appendChild(card);
          }
        } catch (err) {
          console.error("Student fetch error:", err);
          alert("Error loading student");
        }
      });
    } catch (err) {
      console.error("Branch fetch error:", err);
      alert("Error fetching students");
    }
  });
}

async function showStudents() {
  const info = document.getElementById("data");
  const response = await fetch("https://json-server-api-3-xhbm.onrender.com/users");
  const data = await response.json();
  const students = data.filter(user => user.type === "student");
  info.innerHTML = "";

  students.forEach(student => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="info">
        <p><b>Name :</b> ${student.name}</p>
        <p><b>ID :</b> ${student.id}</p>
      </div>
      <p><b>Email :</b> ${student.username}</p>
      <p><b>Branch :</b> ${student.branch}</p>
      <p><b>Semester :</b> ${student.currentSemester}</p>
      <div class="buttons">
        <button onclick="editStudent('${student.id}')">Edit</button>
        <button onclick="deleteStudent('${student.id}')">Delete</button>
      </div>
    `;
    info.appendChild(card);
  });
}

window.editStudent = async function (id) {
  try {
    const res = await fetch(`https://json-server-api-3-xhbm.onrender.com/users?id=${id}`);
    const students = await res.json();
    if (!students.length) return alert("Student not found");

    const student = students[0];
    const formContainer = document.getElementById("editForm");

    formContainer.innerHTML = `
      <h3>Edit Student</h3>
      <form id="editStudentForm">
        <label>Name</label><br>
        <input type="text" id="editName" value="${student.name}" required><br>
        <label>Email</label><br>
        <input type="text" id="editEmail" value="${student.username}" required><br>
        <label>Branch</label><br>
        <input type="text" id="editBranch" value="${student.branch}" required><br>
        <label>Semester</label><br>
        <input type="text" id="editSem" value="${student.currentSemester}" required><br><br>
        <button type="submit">Update</button>
        <button type="button" onclick="document.getElementById('editForm').style.display='none'">Cancel</button>
      </form>
    `;
    formContainer.style.display = "block";

    document.getElementById("editStudentForm").onsubmit = async function (e) {
      e.preventDefault();
      const updatedStudent = {
        ...student,
        name: document.getElementById("editName").value,
        username: document.getElementById("editEmail").value,
        branch: document.getElementById("editBranch").value,
        currentSemester: document.getElementById("editSem").value
      };

      const updateRes = await fetch(`https://json-server-api-3-xhbm.onrender.com/users/${student.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedStudent)
      });

      if (updateRes.ok) {
        alert("Student updated");
        formContainer.style.display = "none";
        document.getElementById("data").innerHTML = "";
        showStudents();
      } else {
        alert("Update failed");
      }
    };
  } catch (err) {
    console.error("Edit error:", err);
    alert("Error editing student");
  }
};

window.deleteStudent = async function (id) {
  if (!confirm("Are you sure you want to delete this student?")) return;

  try {
    const res = await fetch(`https://json-server-api-3-xhbm.onrender.com/users/${id}`, {
      method: "DELETE"
    });

    if (res.ok) {
      alert("Student deleted successfully");
      document.getElementById("data").innerHTML = "";
      showStudents();
    } else {
      alert("Delete failed");
    }
  } catch (err) {
    console.error("Delete error:", err);
    alert("Error deleting student");
  }
};
function addStudent() {
  const create = document.getElementById("create");
  create.innerHTML = `
    <div class="modal-content">
      <span class="close" onclick="closeModal()">&times;</span>
      <h3>Add New Student</h3>
      <form id="createForm">
        <input type="text" id="name" placeholder="Enter Name" required><br>
        <input type="text" id="roll" placeholder="Enter Roll No." required><br>
        <input type="text" id="email" placeholder="Enter Email" required><br>
        <input type="password" id="password" placeholder="Enter Password" required><br>
        <input type="text" id="branch" placeholder="Enter Branch" required><br>
        <input type="text" id="sem" placeholder="Enter Semester" required><br><br>
        <button type="submit">Create</button>
      </form>
    </div>
  `;
  create.style.display = "block";

  // Attach event handler
  document.getElementById("createForm").onsubmit = createStudent;
}

function closeModal() {
  document.getElementById("create").style.display = "none";
  document.getElementById("create").innerHTML = ""; // Clean up the form
}

async function createStudent(e) {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const id = document.getElementById("roll").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const branch = document.getElementById("branch").value.trim();
  const sem = document.getElementById("sem").value.trim();

  if (!name || !id || !email || !password || !branch || !sem) {
    alert("Please fill all fields.");
    return;
  }

  const data = {
    id,
    name,
    username: email,
    password,
    type: "student",
    branch,
    currentSemester: sem
  };

  try {
    const response = await fetch("https://json-server-api-3-xhbm.onrender.com/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      alert("Student created successfully");
      closeModal();
      showStudents();
    } else {
      alert("Error creating student.");
    }
  } catch (err) {
    console.error("Create error:", err);
    alert("Failed to add student");
  }
}
