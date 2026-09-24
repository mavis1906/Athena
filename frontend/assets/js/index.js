const userData = localStorage.getItem("athenaUser");
const token = localStorage.getItem("athenaToken");

if (!userData || !token) {
    localStorage.removeItem("athenaUser");
    localStorage.removeItem("athenaToken");
    window.location.href = "login.html";
}

const user = JSON.parse(userData);

const API_URL = "https://athena-nf7s.onrender.com";

const authHeaders = {
    "Authorization": `Bearer ${token}`
};

const userGreeting = document.getElementById("userGreeting");
const roleInformation = document.getElementById("roleInformation");
const roleProblems = document.getElementById("roleProblems");
const navButtons = document.querySelectorAll(".navButton");
const sections = document.querySelectorAll(".appSection");
const settingsLogoutButton = document.getElementById("settingsLogoutButton");
const problemForm = document.getElementById("problemForm");
const problemMessage = document.getElementById("problemMessage");
const createProblemButton = document.getElementById("createProblemButton");
const problemFormContainer = document.getElementById("problemFormContainer");
const problemsFeed = document.getElementById("problemsFeed");
const overviewProblems = document.getElementById("overviewProblems");
const problemDetail = document.getElementById("problemDetail");
const problemDetailContent = document.getElementById("problemDetailContent");
const backToProblemsButton = document.getElementById("backToProblemsButton");
const solvedProblems = document.getElementById("solvedProblems");

userGreeting.textContent = `Welcome, ${user.full_name}`;
roleInformation.textContent = `${user.category} — ${user.role}`;

function logout() {
    localStorage.removeItem("athenaUser");
    localStorage.removeItem("athenaToken");
    window.location.href = "login.html";
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}

function createProblemCard(problem) {
    const card = document.createElement("article");

    card.className = "problemCard";
    card.dataset.problemId = problem.id;

    const tag = document.createElement("div");
    tag.className = "problemTag";
    tag.textContent = "PROBLEM";

    const title = document.createElement("h3");
    title.textContent = problem.title;

    const description = document.createElement("p");
    description.textContent = problem.description;

    const creator = document.createElement("p");
    creator.textContent = `Posted by ${problem.creator.full_name}`;

    const category = document.createElement("p");
    category.textContent = `${problem.category} — ${problem.role}`;

    const createdAt = document.createElement("p");
    createdAt.textContent = formatDate(problem.created_at);

    card.appendChild(tag);
    card.appendChild(title);
    card.appendChild(description);
    card.appendChild(creator);
    card.appendChild(category);
    card.appendChild(createdAt);

    if (problem.images && problem.images.length > 0) {
        const imageContainer = document.createElement("div");

        imageContainer.className = "problemImages";

        problem.images.forEach((imagePath) => {
            const image = document.createElement("img");

            image.src = `${API_URL}${imagePath}`;
            image.alt = problem.title;

            imageContainer.appendChild(image);
        });

        card.appendChild(imageContainer);
    }

    card.addEventListener("click", () => {
        loadProblemDetail(problem.id);
    });

    return card;
}

function renderProblems(problems) {
    problemsFeed.innerHTML = "";
    overviewProblems.innerHTML = "";

    if (!problems.length) {
        problemsFeed.innerHTML = "<p>No active problems yet.</p>";
        overviewProblems.innerHTML = "<p>No active problems yet.</p>";
        return;
    }

    problems.forEach((problem) => {
        problemsFeed.appendChild(createProblemCard(problem));
        overviewProblems.appendChild(createProblemCard(problem));
    });
}

async function loadProblems() {
    try {
        const response = await fetch(`${API_URL}/problems`);

        const data = await response.json();

        if (!response.ok) {
            problemsFeed.innerHTML = "<p>Unable to load problems.</p>";
            overviewProblems.innerHTML = "<p>Unable to load problems.</p>";
            return;
        }

        renderProblems(data);
    } catch (error) {
        problemsFeed.innerHTML =
            "<p>Unable to connect to the Athena server.</p>";

        overviewProblems.innerHTML =
            "<p>Unable to connect to the Athena server.</p>";
    }
}

async function loadRoleProblems() {
    roleProblems.innerHTML = "<p>Loading role problems...</p>";

    try {
        const response = await fetch(
            `${API_URL}/problems/role`,
            {
                headers: authHeaders
            }
        );

        const data = await response.json();

        if (!response.ok) {
            roleProblems.innerHTML =
                "<p>Unable to load role problems.</p>";
            return;
        }

        roleProblems.innerHTML = "";

        if (!data.length) {
            roleProblems.innerHTML =
                "<p>No problems for your role yet.</p>";
            return;
        }

        data.forEach((problem) => {
            roleProblems.appendChild(createProblemCard(problem));
        });
    } catch (error) {
        roleProblems.innerHTML =
            "<p>Unable to connect to the Athena server.</p>";
    }
}

async function loadSolvedProblems() {
    solvedProblems.innerHTML = "<p>Loading solved problems...</p>";

    try {
        const response = await fetch(
            `${API_URL}/problems/solved`
        );

        const data = await response.json();

        if (!response.ok) {
            solvedProblems.innerHTML =
                "<p>Unable to load solved problems.</p>";
            return;
        }

        solvedProblems.innerHTML = "";

        if (!data.length) {
            solvedProblems.innerHTML =
                "<p>No solved problems yet.</p>";
            return;
        }

        data.forEach((problem) => {
            const card = document.createElement("article");

            card.className = "problemCard";

            const tag = document.createElement("div");
            tag.className = "problemTag";
            tag.textContent = "SOLVED";

            const title = document.createElement("h3");
            title.textContent = problem.title;

            const description = document.createElement("p");
            description.textContent = problem.description;

            const creator = document.createElement("p");
            creator.textContent =
                `Posted by ${problem.creator.full_name}`;

            const completion = document.createElement("p");
            completion.textContent =
                `Completion: ${problem.completion_message}`;

            const completedAt = document.createElement("p");
            completedAt.textContent =
                `Completed: ${formatDate(problem.completed_at)}`;

            card.appendChild(tag);
            card.appendChild(title);
            card.appendChild(description);
            card.appendChild(creator);
            card.appendChild(completion);
            card.appendChild(completedAt);

            if (problem.images && problem.images.length > 0) {
                const imageContainer = document.createElement("div");

                imageContainer.className = "problemImages";

                problem.images.forEach((imagePath) => {
                    const image = document.createElement("img");

                    image.src =
                        `${API_URL}${imagePath}`;

                    image.alt = problem.title;

                    imageContainer.appendChild(image);
                });

                card.appendChild(imageContainer);
            }

            card.addEventListener("click", () => {
                loadProblemDetail(problem.id);
            });

            solvedProblems.appendChild(card);
        });
    } catch (error) {
        solvedProblems.innerHTML =
            "<p>Unable to connect to the Athena server.</p>";
    }
}

async function loadComments(problemId) {
    const commentsContainer =
        document.getElementById("commentsContainer");

    commentsContainer.innerHTML = "<p>Loading comments...</p>";

    try {
        const response = await fetch(
            `${API_URL}/problems/${problemId}/comments`
        );

        const data = await response.json();

        if (!response.ok) {
            commentsContainer.innerHTML =
                "<p>Unable to load comments.</p>";
            return;
        }

        commentsContainer.innerHTML = "";

        if (!data.length) {
            commentsContainer.innerHTML =
                "<p>No comments yet.</p>";
            return;
        }

        data.forEach((comment) => {
            const commentCard = document.createElement("article");

            commentCard.className = "commentCard";

            const author = document.createElement("strong");
            author.textContent = comment.user.full_name;

            const content = document.createElement("p");
            content.textContent = comment.content;

            const date = document.createElement("small");
            date.textContent = formatDate(comment.created_at);

            commentCard.appendChild(author);
            commentCard.appendChild(content);
            commentCard.appendChild(date);

            commentsContainer.appendChild(commentCard);
        });
    } catch (error) {
        commentsContainer.innerHTML =
            "<p>Unable to connect to the Athena server.</p>";
    }
}

async function submitComment(problemId) {
    const commentInput = document.getElementById("commentInput");
    const commentMessage =
        document.getElementById("commentMessage");

    const content = commentInput.value.trim();

    if (!content) {
        commentMessage.textContent =
            "Write a comment first.";
        return;
    }

    commentMessage.textContent =
        "Posting comment...";

    try {
        const response = await fetch(
            `${API_URL}/problems/${problemId}/comments`,
            {
                method: "POST",
                headers: {
                    ...authHeaders,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    content: content
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            commentMessage.textContent =
                data.detail ||
                "Unable to post comment.";
            return;
        }

        commentInput.value = "";
        commentMessage.textContent =
            "Comment posted.";

        await loadProblemDetail(problemId);
    } catch (error) {
        commentMessage.textContent =
            "Unable to connect to the Athena server.";
    }
}

async function toggleLike(problemId) {
    const likeButton =
        document.getElementById("likeButton");

    const likeCount =
        document.getElementById("likeCount");

    likeButton.disabled = true;

    try {
        const response = await fetch(
            `${API_URL}/problems/${problemId}/like`,
            {
                method: "POST",
                headers: authHeaders
            }
        );

        const data = await response.json();

        if (!response.ok) {
            likeButton.disabled = false;
            return;
        }

        likeButton.textContent =
            data.liked ? "Unlike" : "Like";

        likeCount.textContent =
            `${data.like_count} likes`;

        likeButton.disabled = false;
    } catch (error) {
        likeButton.disabled = false;
    }
}

async function completeProblem(problemId) {
    const completionInput =
        document.getElementById("completionInput");

    const completionMessage =
        document.getElementById("completionMessage");

    const message = completionInput.value.trim();

    if (!message) {
        completionMessage.textContent =
            "Enter a completion message first.";

        return;
    }

    completionMessage.textContent =
        "Marking problem as completed...";

    try {
        const response = await fetch(
            `${API_URL}/problems/${problemId}/complete`,
            {
                method: "POST",
                headers: {
                    ...authHeaders,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    completion_message: message
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            completionMessage.textContent =
                data.detail ||
                "Unable to complete problem.";

            return;
        }

        completionMessage.textContent =
            "Problem completed successfully.";

        await loadProblems();
        await loadRoleProblems();
        await loadSolvedProblems();
        await loadProblemDetail(problemId);
    } catch (error) {
        completionMessage.textContent =
            "Unable to connect to the Athena server.";
    }
}

async function loadProblemDetail(problemId) {
    sections.forEach((section) => {
        section.hidden = true;
    });

    problemDetail.hidden = false;
    problemDetailContent.innerHTML =
        "<p>Loading problem...</p>";

    try {
        const response = await fetch(
            `${API_URL}/problems/${problemId}`
        );

        const data = await response.json();

        if (!response.ok) {
            problemDetailContent.innerHTML =
                "<p>Unable to load problem.</p>";
            return;
        }

        renderProblemDetail(data);
        await loadComments(problemId);
    } catch (error) {
        problemDetailContent.innerHTML =
            "<p>Unable to connect to the Athena server.</p>";
    }
}

function renderProblemDetail(problem) {
    problemDetailContent.innerHTML = "";

    const tag = document.createElement("div");
    tag.className = "problemTag";
    tag.textContent =
        problem.status === "completed"
            ? "SOLVED"
            : "PROBLEM";

    const title = document.createElement("h2");
    title.textContent = problem.title;

    const description = document.createElement("p");
    description.textContent = problem.description;

    const creator = document.createElement("p");
    creator.textContent =
        `Posted by ${problem.creator.full_name}`;

    const category = document.createElement("p");
    category.textContent =
        `${problem.category} — ${problem.role}`;

    const createdAt = document.createElement("p");
    createdAt.textContent =
        formatDate(problem.created_at);

    const status = document.createElement("p");
    status.textContent =
        `Status: ${problem.status}`;

    problemDetailContent.appendChild(tag);
    problemDetailContent.appendChild(title);
    problemDetailContent.appendChild(description);
    problemDetailContent.appendChild(creator);
    problemDetailContent.appendChild(category);
    problemDetailContent.appendChild(createdAt);
    problemDetailContent.appendChild(status);

    if (problem.images && problem.images.length > 0) {
        const imageContainer = document.createElement("div");

        imageContainer.className =
            "problemDetailImages";

        problem.images.forEach((imagePath) => {
            const image = document.createElement("img");

            image.src =
                `${API_URL}${imagePath}`;

            image.alt = problem.title;

            imageContainer.appendChild(image);
        });

        problemDetailContent.appendChild(imageContainer);
    }

    if (problem.status === "completed") {
        const completionTitle =
            document.createElement("h3");

        completionTitle.textContent =
            "Completion";

        const completionText =
            document.createElement("p");

        completionText.textContent =
            problem.completion_message;

        const completedDate =
            document.createElement("p");

        completedDate.textContent =
            `Completed: ${formatDate(problem.completed_at)}`;

        problemDetailContent.appendChild(
            completionTitle
        );

        problemDetailContent.appendChild(
            completionText
        );

        problemDetailContent.appendChild(
            completedDate
        );
    }

    if (problem.status === "active") {
        const likeSection =
            document.createElement("div");

        const likeButton =
            document.createElement("button");

        likeButton.id = "likeButton";
        likeButton.type = "button";
        likeButton.textContent = "Like";

        const likeCount =
            document.createElement("span");

        likeCount.id = "likeCount";
        likeCount.textContent =
            `${problem.like_count} likes`;

        likeButton.addEventListener("click", () => {
            toggleLike(problem.id);
        });

        likeSection.appendChild(likeButton);
        likeSection.appendChild(likeCount);

        problemDetailContent.appendChild(
            likeSection
        );

        if (problem.creator.id === user.user_id) {
            const completionSection =
                document.createElement("div");

            const completionTitle =
                document.createElement("h3");

            completionTitle.textContent =
                "Mark Problem as Completed";

            const completionForm =
                document.createElement("form");

            const completionInput =
                document.createElement("textarea");

            completionInput.id =
                "completionInput";

            completionInput.placeholder =
                "Explain how this problem was solved...";

            completionInput.required = true;

            const completionButton =
                document.createElement("button");

            completionButton.type = "submit";
            completionButton.textContent =
                "Complete Problem";

            const completionMessage =
                document.createElement("p");

            completionMessage.id =
                "completionMessage";

            completionForm.appendChild(
                completionInput
            );

            completionForm.appendChild(
                completionButton
            );

            completionForm.appendChild(
                completionMessage
            );

            completionForm.addEventListener(
                "submit",
                (event) => {
                    event.preventDefault();
                    completeProblem(problem.id);
                }
            );

            completionSection.appendChild(
                completionTitle
            );

            completionSection.appendChild(
                completionForm
            );

            problemDetailContent.appendChild(
                completionSection
            );
        }
    }

    const commentsTitle =
        document.createElement("h3");

    commentsTitle.textContent =
        "Discussion";

    const commentForm =
        document.createElement("form");

    commentForm.id = "commentForm";

    const commentInput =
        document.createElement("textarea");

    commentInput.id = "commentInput";
    commentInput.placeholder =
        "Share your solution or thoughts...";
    commentInput.required = true;

    const commentButton =
        document.createElement("button");

    commentButton.type = "submit";
    commentButton.textContent =
        "Comment";

    const commentMessage =
        document.createElement("p");

    commentMessage.id =
        "commentMessage";

    const commentsContainer =
        document.createElement("div");

    commentsContainer.id =
        "commentsContainer";

    commentForm.appendChild(commentInput);
    commentForm.appendChild(commentButton);
    commentForm.appendChild(commentMessage);

    commentForm.addEventListener(
        "submit",
        (event) => {
            event.preventDefault();
            submitComment(problem.id);
        }
    );

    problemDetailContent.appendChild(
        commentsTitle
    );

    problemDetailContent.appendChild(
        commentForm
    );

    problemDetailContent.appendChild(
        commentsContainer
    );
}

navButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const selectedSection =
            button.dataset.section;

        sections.forEach((section) => {
            section.hidden =
                section.id !== selectedSection;
        });

        if (selectedSection === "role") {
            loadRoleProblems();
        }

        if (selectedSection === "solved") {
            loadSolvedProblems();
        }
    });
});

settingsLogoutButton.addEventListener(
    "click",
    logout
);

backToProblemsButton.addEventListener(
    "click",
    () => {
        sections.forEach((section) => {
            section.hidden =
                section.id !== "problems";
        });
    }
);

createProblemButton.addEventListener(
    "click",
    () => {
        problemFormContainer.hidden =
            !problemFormContainer.hidden;

        createProblemButton.textContent =
            problemFormContainer.hidden
                ? "Create Problem"
                : "Close";
    }
);

problemForm.addEventListener(
    "submit",
    async (event) => {
        event.preventDefault();

        problemMessage.textContent =
            "Posting problem...";

        const formData = new FormData();

        formData.append(
            "title",
            document
                .getElementById("problemTitle")
                .value
                .trim()
        );

        formData.append(
            "description",
            document
                .getElementById("problemDescription")
                .value
                .trim()
        );

        const image1 =
            document
                .getElementById("problemImage1")
                .files[0];

        const image2 =
            document
                .getElementById("problemImage2")
                .files[0];

        const image3 =
            document
                .getElementById("problemImage3")
                .files[0];

        const image4 =
            document
                .getElementById("problemImage4")
                .files[0];

        formData.append("image1", image1);

        if (image2) {
            formData.append("image2", image2);
        }

        if (image3) {
            formData.append("image3", image3);
        }

        if (image4) {
            formData.append("image4", image4);
        }

        try {
            const response = await fetch(
                `${API_URL}/problems`,
                {
                    method: "POST",
                    headers: authHeaders,
                    body: formData
                }
            );

            const data = await response.json();

            if (!response.ok) {
                problemMessage.textContent =
                    data.detail ||
                    "Failed to post problem";
                return;
            }

            problemMessage.textContent =
                "Problem posted successfully";

            problemForm.reset();

            problemFormContainer.hidden =
                true;

            createProblemButton.textContent =
                "Create Problem";

            await loadProblems();
            await loadRoleProblems();
        } catch (error) {
            problemMessage.textContent =
                "Unable to connect to the Athena server";
        }
    }
);

loadProblems();
loadSolvedProblems();