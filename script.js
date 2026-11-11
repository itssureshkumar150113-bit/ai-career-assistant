
const getStartedBtn = document.getElementById("getStartedBtn");
const applicationForm = document.getElementById("applicationForm");

const companyInput = document.getElementById("companyName");
const roleInput = document.getElementById("jobTitle");
const statusInput = document.getElementById("applicationStatus");
const dateInput = document.getElementById("appliedDate");

const applicationList = document.getElementById("applicationList");
const emptyState = document.getElementById("emptyState");

const totalApplications = document.getElementById("totalApplications");
const interviewCount = document.getElementById("interviewCount");
const offerCount = document.getElementById("offerCount");

const STORAGE_KEY = "aiCareerApplications";

const searchInput=document.getElementById("searchApplications");
const statusFilter =document.getElementById("statusFilter");


// 1. Make Get Started scroll to the tracker
getStartedBtn.addEventListener("click", function () {
    document.getElementById("job-tracker").scrollIntoView({
        behavior: "smooth"
    });
});


// 2. Set today's date in the date input
function setDefaultDate() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    dateInput.value = `${year}-${month}-${day}`;
}

setDefaultDate();


// 3. Load previously saved applications
function loadApplications() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (!savedData) {
            return [];
        }

        const parsedData = JSON.parse(savedData);

        return Array.isArray(parsedData) ? parsedData : [];
    } catch (error) {
        console.error("Could not load applications:", error);
        return [];
    }
}

let applications = loadApplications();


// 4. Save applications in the browser
function saveApplications() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(applications)
        );
    } catch (error) {
        console.error("Could not save applications:", error);
        alert("Your changes could not be saved in this browser.");
    }
}


// 5. Update dashboard numbers
function updateDashboardStats() {
    totalApplications.textContent = applications.length;

    interviewCount.textContent = applications.filter(
        function (application) {
            return application.status === "Interview";
        }
    ).length;

    offerCount.textContent = applications.filter(
        function (application) {
            return application.status === "Offer";
        }
    ).length;
}


// 6. Display applications on the page
function renderApplications() {
    applicationList.replaceChildren();

    // Get the current search and filter values.
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedStatus = statusFilter.value;

    // Filter applications by company, role, and status.
    const filteredApplications = applications
        .filter(function (application) {
            const matchesSearch =
                application.company.toLowerCase().includes(searchTerm) ||
                application.role.toLowerCase().includes(searchTerm);

            const matchesStatus =
                selectedStatus === "All" ||
                application.status === selectedStatus;

            return matchesSearch && matchesStatus;
        })
        .sort(function (a, b) {
            return (b.createdAt || 0) - (a.createdAt || 0);
        });

    // Show an appropriate message when there are no results.
    emptyState.hidden = filteredApplications.length > 0;

    const emptyTitle = emptyState.querySelector("h3");
    const emptyMessage = emptyState.querySelector("p");

    if (applications.length === 0) {
        emptyTitle.textContent = "No applications yet";
        emptyMessage.textContent =
            "Add your first job application using the form above.";
    } else if (filteredApplications.length === 0) {
        emptyTitle.textContent = "No matching applications";
        emptyMessage.textContent =
            "Try another search term or choose a different status.";
    }

    // Display the matching applications.
    filteredApplications.forEach(function (application) {
        const card = document.createElement("article");
        card.className = "application-card";

        const info = document.createElement("div");
        info.className = "application-info";

        const role = document.createElement("h3");
        role.textContent = application.role;

        const company = document.createElement("p");
        company.textContent = application.company;

        const appliedDate = document.createElement("p");
        const date = new Date(
            `${application.appliedDate}T00:00:00`
        );

        appliedDate.textContent = Number.isNaN(date.getTime())
            ? `Applied: ${application.appliedDate}`
            : `Applied: ${date.toLocaleDateString()}`;

        info.append(role, company, appliedDate);

        const actions = document.createElement("div");
        actions.className = "application-actions";

        const statusSelect = document.createElement("select");
        statusSelect.className = "status-select";
        statusSelect.dataset.action = "status";
        statusSelect.dataset.id = application.id;
        statusSelect.setAttribute(
            "aria-label",
            `Status for ${application.role} at ${application.company}`
        );

        ["Applied", "Interview", "Rejected", "Offer"].forEach(
            function (status) {
                const option = document.createElement("option");
                option.value = status;
                option.textContent = status;
                option.selected = status === application.status;

                statusSelect.appendChild(option);
            }
        );

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-btn";
        deleteButton.textContent = "Delete";
        deleteButton.dataset.action = "delete";
        deleteButton.dataset.id = application.id;

        actions.append(statusSelect, deleteButton);
        card.append(info, actions);
        applicationList.appendChild(card);
    });

    // Keep the dashboard statistics updated.
    updateDashboardStats();
}

// 7. Add a new application when the form is submitted
applicationForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const company = companyInput.value.trim();
    const role = roleInput.value.trim();

    // Don't add entries containing only spaces.
    if (!company || !role) {
        alert("Please enter both the company name and job role.");
        return;
    }

    const newApplication = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        company: company,
        role: role,
        status: statusInput.value,
        appliedDate: dateInput.value,
        createdAt: Date.now()
    };

    applications.unshift(newApplication);

    saveApplications();
    renderApplications();

    applicationForm.reset();
    setDefaultDate();
});


// 8. Change application status
applicationList.addEventListener("change", function (event) {
    const target = event.target;

    if (!target.matches('select[data-action="status"]')) {
        return;
    }

    const application = applications.find(function (item) {
        return item.id === target.dataset.id;
    });

    if (!application) {
        return;
    }

    application.status = target.value;

    saveApplications();
   renderApplications();
});


// 9. Delete an application
applicationList.addEventListener("click", function (event) {
    const deleteButton = event.target.closest(
        'button[data-action="delete"]'
    );

    if (!deleteButton) {
        return;
    }

    const applicationId = deleteButton.dataset.id;

    applications = applications.filter(function (application) {
        return application.id !== applicationId;
    });

    saveApplications();
    renderApplications();
});

searchInput.addEventListener("input",renderApplications);
statusFilter.addEventListener("change",renderApplications);

// 10. Display saved applications when the page opens
renderApplications();