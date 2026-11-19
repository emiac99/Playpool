/* ========================================
   POOLPLAY SETTINGS
======================================== */

const NORMAL_POOL_COUNT = 20;
const SPECIAL_POOL_COUNT = 10;

const DAILY_LIMIT = 20;
const UNLOCK_REQUIREMENT = 10;

const NORMAL_POOL_REWARD = 0.0001;
const SPECIAL_POOL_REWARD = 0.0002;

const STORAGE_KEY = "poolPlayDemoState_v1";

let state = null;
let toastTimer = null;
let sharedPoolChannel = null;

/* ========================================
   DATE AND DEFAULT DATA
======================================== */

function todayKey() {
    const now = new Date();

    return (
        now.getFullYear() + "-" +
        String(now.getMonth() + 1).padStart(2, "0") + "-" +
        String(now.getDate()).padStart(2, "0")
    );
}


function freshState() {
    return {
        demoBalance: 0,

        totalNormalPoolsEntered: [],

        dailyDate: todayKey(),

        dailyNormalEntries: [],

        dailySpecialEntries: [],

        entryHistory: [],

        withdrawalRequests: [],
        
rewardedPoolsToday: [],

rewardHistory: [],
        
        poolPrizeBalances: {},
        
rewardedPoolsToday: []
    };
}


/* ========================================
   NORMALIZE SAVED DATA
======================================== */

function normalizeState(saved) {
    if (!saved || typeof saved !== "object") {
        saved = {};
    }

    const result = {
        ...freshState(),
        ...saved
    };

result.poolPrizeBalances =
    result.poolPrizeBalances &&
    typeof result.poolPrizeBalances === "object" &&
    !Array.isArray(result.poolPrizeBalances)
        ? result.poolPrizeBalances
        : {};

result.rewardedPoolsToday =
    Array.isArray(result.rewardedPoolsToday)
        ? result.rewardedPoolsToday
        : [];

result.rewardHistory =
    Array.isArray(result.rewardHistory)
        ? result.rewardHistory
        : [];

    result.demoBalance =
        Number.isFinite(Number(result.demoBalance))
            ? Number(result.demoBalance)
            : 0;

    result.totalNormalPoolsEntered =
        Array.isArray(result.totalNormalPoolsEntered)
            ? result.totalNormalPoolsEntered
            : [];

    result.dailyNormalEntries =
        Array.isArray(result.dailyNormalEntries)
            ? result.dailyNormalEntries
            : [];

    result.dailySpecialEntries =
        Array.isArray(result.dailySpecialEntries)
            ? result.dailySpecialEntries
            : [];

    result.entryHistory =
        Array.isArray(result.entryHistory)
            ? result.entryHistory
            : [];

    result.withdrawalRequests =
        Array.isArray(result.withdrawalRequests)
            ? result.withdrawalRequests
            : [];
            
        result.rewardedPoolsToday =
    Array.isArray(result.rewardedPoolsToday)
        ? result.rewardedPoolsToday
        : [];

result.rewardHistory =
    Array.isArray(result.rewardHistory)
        ? result.rewardHistory
        : [];

    if (result.dailyDate !== todayKey()) {
        result.dailyDate = todayKey();

        result.dailyNormalEntries = [];
        result.dailySpecialEntries = [];
        result.rewardedPoolsToday = [];
    }

    return result;
}


/* ========================================
   LOAD DATA FROM THIS DEVICE
======================================== */

function loadState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved) {
            state = normalizeState(JSON.parse(saved));
        } else {
            state = freshState();
        }

        // Save the normalized state, including any daily reset.
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(state)
        );

    } catch (error) {
        console.error(
            "Could not load PoolPlay data:",
            error
        );

        state = freshState();

        showToast(
            "Could not read saved data. Starting with fresh demo data."
        );
    }
}


/* ========================================
   SAVE DATA TO THIS DEVICE
======================================== */

function saveState() {
    if (!state) {
        return;
    }

    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(state)
        );
    } catch (error) {
        console.error(
            "Could not save PoolPlay data:",
            error
        );

        showToast(
            "Could not save data in this browser."
        );
    }
}


/* ========================================
   SAFE HTML TEXT
======================================== */

function escapeHTML(value) {
    const replacements = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    };

    return String(value).replace(
        /[&<>"']/g,
        function (character) {
            return replacements[character];
        }
    );
}


/* ========================================
   TOAST NOTIFICATIONS
======================================== */

function showToast(message) {
    const toast = document.getElementById("toast");

    if (!toast) {
        return;
    }

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(function () {
        toast.classList.remove("show");
    }, 2600);
}


/* ========================================
   NAVIGATION MENU
======================================== */

const sideMenu =
    document.getElementById("sideMenu");

const menuBackdrop =
    document.getElementById("menuBackdrop");

const menuToggle =
    document.getElementById("menuToggle");

const menuClose =
    document.getElementById("menuClose");


function openMenu() {
    sideMenu.classList.add("open");

    menuBackdrop.classList.add("open");

    document.body.classList.add("menu-open");

    menuToggle.setAttribute(
        "aria-expanded",
        "true"
    );
}


function closeMenu() {
    sideMenu.classList.remove("open");

    menuBackdrop.classList.remove("open");

    document.body.classList.remove("menu-open");

    menuToggle.setAttribute(
        "aria-expanded",
        "false"
    );
}


function showScreen(screenId) {
    const screens =
        document.querySelectorAll(".app-screen");

    let screenFound = false;

    screens.forEach(function (screen) {
        const selected = screen.id === screenId;

        screen.classList.toggle(
            "active",
            selected
        );

        if (selected) {
            screenFound = true;
        }
    });

    if (!screenFound) {
        console.error(
            "PoolPlay screen was not found:",
            screenId
        );

        return;
    }

    document.querySelectorAll(".menu-link").forEach(
        function (button) {
            button.classList.toggle(
                "active",
                button.dataset.screen === screenId
            );
        }
    );

    closeMenu();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    if (screenId === "walletScreen") {
        renderWallet();
    }

    if (screenId === "entriesScreen") {
        renderMyEntries();
    }

    if (screenId === "winnersScreen") {
        renderWinners();
    }
}


menuToggle.addEventListener(
    "click",
    function () {
        if (sideMenu.classList.contains("open")) {
            closeMenu();
        } else {
            openMenu();
        }
    }
);


menuClose.addEventListener("click", closeMenu);

menuBackdrop.addEventListener("click", closeMenu);


document.querySelectorAll(".menu-link").forEach(
    function (button) {
        button.addEventListener(
            "click",
            function () {
                showScreen(button.dataset.screen);
            }
        );
    }
);


document.addEventListener(
    "keydown",
    function (event) {
        if (event.key === "Escape") {
            closeMenu();
        }
    }
);


/* ========================================
   SPECIAL POOL ELIGIBILITY
======================================== */

function isSpecialUnlocked() {
    return (
        state.totalNormalPoolsEntered.length >=
        UNLOCK_REQUIREMENT
    );
}


/* ========================================
   CREATE A POOL CARD
======================================== */

/* ========================================
   CREATE A POOL CARD
======================================== */

function makePoolCard(number, special = false) {
const poolId = special ? "S" + number : "N" + number;

const enteredToday = special
    ? state.dailySpecialEntries.includes(poolId)
    : state.dailyNormalEntries.includes(poolId);

const locked = special && !isSpecialUnlocked();

const rewardedToday =
    Array.isArray(state.rewardedPoolsToday) &&
    state.rewardedPoolsToday.includes(poolId);

const reward = special ? 0.0002 : 0.0001;

// Read this pool's prize balance, not the user's wallet balance.
const poolBalance =
    Number(state.sharedPoolBalances?.[poolId]) || 0;

const sharedEntryCount =
    Number(state.sharedPoolEntries?.[poolId]) || 0;

const card = document.createElement("article");

card.className = special
    ? "pool-card special"
    : "pool-card";

const title = special
    ? "Special Pool " + number
    : "Normal Pool " + number;

let status;

if (locked) {
    status = `<span class="pool-status locked">🔒 LOCKED</span>`;
} else if (rewardedToday) {
    status = `<span class="pool-status">✓ REWARD ADDED TO POOL</span>`;
} else if (enteredToday) {
    status = `<span class="pool-status">✓ ENTERED</span>`;
} else {
    status = `<span class="pool-status">OPEN</span>`;
}

let enterButtonText = "Enter Pool";

if (locked) {
    enterButtonText = "Unlock at 10 pools";
} else if (enteredToday) {
    enterButtonText = "Already entered today";
}

let rewardButtonText = "▶ Complete Demo Ad";

if (locked) {
    rewardButtonText = "🔒 Special Pool Locked";
} else if (!enteredToday) {
    rewardButtonText = "Enter Pool First";
} else if (rewardedToday) {
    rewardButtonText = "✓ Reward Added to Pool";
}

card.innerHTML = `
    <div class="pool-top">
        <span class="pool-number">
            ${special ? "SPECIAL" : "POOL"}
            ${String(number).padStart(2, "0")}
        </span>

        ${status}
    </div>

    <h3>${title}</h3>

    <div class="pool-amount-label">
        Pool Prize Balance
    </div>

    <div class="pool-amount">
    ${poolBalance.toFixed(2)}
    <small>Demo Points</small>
</div>

<p class="description">
    ${sharedEntryCount} shared entries
</p>

    <button
        type="button"
        class="pool-button enter-pool-button"
        ${locked || enteredToday ? "disabled" : ""}
    >
        ${enterButtonText}
    </button>

    <button
        type="button"
        class="pool-button reward-pool-button"
        style="margin-top:10px;"
        ${locked || !enteredToday || rewardedToday ? "disabled" : ""}
    >
        ${rewardButtonText}
    </button>

    <p class="description" style="margin-top:10px;">
        Demo only. No real advertisement or USDT transfer occurs.
    </p>
`;

// Enter the selected pool.
const enterButton = card.querySelector(".enter-pool-button");

if (!locked && !enteredToday) {
    enterButton.addEventListener("click", function () {
        enterPool(poolId, special);
    });
}

// Simulate completing an advertisement.
const rewardButton = card.querySelector(".reward-pool-button");

if (!locked && enteredToday && !rewardedToday) {
    rewardButton.addEventListener("click", function () {
        const confirmed = confirm(
            "DEMO AD SIMULATION\n\n" +
            "Complete this simulated advertisement?\n\n" +
            "Amount added to this pool: " +
            reward.toFixed(4) + " USDT\n\n" +
            "This is a demo. No real advertisement will play."
        );

        if (!confirmed) {
            return;
        }

        completeDemoAd(poolId, special);
    });
}

return card;

}


/* ========================================
   DISPLAY ALL POOLS
======================================== */

function renderPools() {
const normalContainer = document.getElementById("normalPools");
const specialContainer = document.getElementById("specialPools");

if (!normalContainer || !specialContainer) {
    return;
}

normalContainer.innerHTML = "";
specialContainer.innerHTML = "";

for (let i = 1; i <= NORMAL_POOL_COUNT; i++) {
    normalContainer.appendChild(makePoolCard(i, false));
}

for (let i = 1; i <= SPECIAL_POOL_COUNT; i++) {
    specialContainer.appendChild(makePoolCard(i, true));
}

}


/* ========================================
   ENTER A POOL
======================================== */


async function enterPool(poolId, special) {
    if (!state) {
        showToast("PoolPlay is still loading.");
        return;
    }

    if (!poolPlayAuthClient) {
        showToast("Database connection is unavailable.");
        return;
    }

    if (!Array.isArray(state.dailyNormalEntries)) {
        state.dailyNormalEntries = [];
    }

    if (!Array.isArray(state.dailySpecialEntries)) {
        state.dailySpecialEntries = [];
    }

    if (!Array.isArray(state.totalNormalPoolsEntered)) {
        state.totalNormalPoolsEntered = [];
    }

    if (state.dailyDate !== todayKey()) {
        state.dailyDate = todayKey();
        state.dailyNormalEntries = [];
        state.dailySpecialEntries = [];
        state.rewardedPoolsToday = [];
    }

    if (special && !isSpecialUnlocked()) {
        showToast("Enter 10 different normal pools first.");
        return;
    }

    const list = special
        ? state.dailySpecialEntries
        : state.dailyNormalEntries;

    if (list.includes(poolId)) {
        showToast("You have already entered this pool today.");
        return;
    }

    if (!special && state.dailyNormalEntries.length >= DAILY_LIMIT) {
        showToast("You have reached today's normal pool limit.");
        return;
    }

    showToast("Recording your entry...");

    try {
        const { data, error } = await poolPlayAuthClient
            .rpc("record_pool_entry", {
                p_pool_id: poolId
            });

        if (error) {
            if (error.code === "23505") {
                showToast("You have already entered this pool today.");
            } else {
                showToast(error.message || "Entry could not be recorded.");
            }
            return;
        }

        list.push(poolId);

        if (
            !special &&
            !state.totalNormalPoolsEntered.includes(poolId)
        ) {
            state.totalNormalPoolsEntered.push(poolId);
        }

        const entry = {
            id: poolId,
            name: (special ? "Special Pool " : "Normal Pool ") +
                poolId.substring(1),
            type: special ? "Special" : "Normal",
            date: new Date().toLocaleString(),
            databaseId: data
        };

        if (!Array.isArray(state.entryHistory)) {
            state.entryHistory = [];
        }

        state.entryHistory.unshift(entry);

        saveState();
        render();

        showToast("Pool entry successfully recorded.");

    } catch (err) {
        console.error("Pool entry error:", err);
        showToast("Connection problem. Please try again.");
    }
}


/* ========================================
   DEMO AD COMPLETION AND REWARDS
======================================== */


async function completeDemoAd(poolId, special) {

    if (!state) {
        showToast("PoolPlay is still loading.");
        return;
    }

    const enteredToday = special
        ? state.dailySpecialEntries.includes(poolId)
        : state.dailyNormalEntries.includes(poolId);

    if (!enteredToday) {
        showToast("Enter this pool first.");
        return;
    }

    if (special && !isSpecialUnlocked()) {
        showToast("Special pools are locked.");
        return;
    }

    if (!Array.isArray(state.rewardedPoolsToday)) {
        state.rewardedPoolsToday = [];
    }

    if (state.rewardedPoolsToday.includes(poolId)) {
        showToast("You have already completed this demo ad today.");
        return;
    }

    showToast("Updating shared pool...");

    try {

        const { data, error } = await poolPlayAuthClient
            .rpc("record_demo_ad_reward", {
                p_pool_id: poolId
            });

        if (error) {
            if (error.code === "23505") {
                showToast("Reward already added to this pool today.");
            } else {
                showToast(error.message || "Could not update pool.");
            }
            return;
        }

        state.rewardedPoolsToday.push(poolId);

        saveState();

        await loadSharedPoolData();
        subscribeToSharedPoolData();

        render();

        showToast(
            Number(data).toFixed(4) +
            " demo points added to the shared pool!"
        );

    } catch (err) {
        console.error("Demo reward error:", err);
        showToast("Connection problem. Please try again.");
    }
}


/* ========================================
   DASHBOARD
======================================== */

function renderDashboard() {
    document.getElementById("balance").textContent =
    Number(state.demoBalance).toFixed(4) + " USDT";

    document.getElementById("dailyEntries").textContent =
        state.dailyNormalEntries.length;

    const progress = Math.min(
        state.totalNormalPoolsEntered.length,
        UNLOCK_REQUIREMENT
    );

    document.getElementById("progressText").textContent =
        progress + " / " +
        UNLOCK_REQUIREMENT +
        " normal pools";

    document.getElementById("progressBar").style.width =
        (progress / UNLOCK_REQUIREMENT * 100) + "%";

    const message =
        document.getElementById("unlockMessage");

    if (isSpecialUnlocked()) {
        message.textContent =
            "Special pools are unlocked in this demo.";
    } else {
        const remaining =
            UNLOCK_REQUIREMENT - progress;

        message.textContent =
            "Enter " + remaining +
            " more different normal pool" +
            (remaining === 1 ? "" : "s") +
            " to unlock special pools.";
    }
}


/* ========================================
   WALLET SCREEN
======================================== */

function renderWallet() {
    document.getElementById("walletBalance").textContent =
    Number(state.demoBalance).toFixed(4) + " USDT";

    const history =
        document.getElementById("walletHistory");

    if (state.withdrawalRequests.length === 0) {
        history.textContent = "No wallet activity yet.";

        return;
    }

    history.innerHTML = "";

    state.withdrawalRequests.forEach(
        function (request) {
            const item = document.createElement("div");

            item.className = "history-item";

            item.innerHTML = `
                <strong>Demo withdrawal request</strong>
                <p>Amount: ₦${Number(request.amount).toFixed(2)}</p>
                <p>Status: ${escapeHTML(request.status)}</p>
                <p>Date: ${escapeHTML(request.date)}</p>
            `;

            history.appendChild(item);
        }
    );
}


/* ========================================
   DEMONSTRATION WITHDRAWAL REQUEST
======================================== */

document
    .getElementById("withdrawalForm")
    .addEventListener(
        "submit",
        function (event) {
            event.preventDefault();

            const amountInput =
                document.getElementById("withdrawalAmount");

            const result =
                document.getElementById("withdrawalResult");

            const amount = Number(amountInput.value);

            if (!Number.isFinite(amount) || amount <= 0) {
                showToast(
                    "Enter a valid demonstration amount."
                );

                return;
            }

            const request = {
                id: "DEMO-" + Date.now(),

                amount: amount,

                status:
                    "Demo only — not submitted for payment",

                date: new Date().toLocaleString()
            };

            state.withdrawalRequests.unshift(request);

            saveState();

            amountInput.value = "";

            result.textContent =
                "Demo request recorded. No real money was requested or sent.";

            renderWallet();

            showToast(
                "Demo withdrawal request recorded."
            );
        }
    );


/* ========================================
   MY ENTRIES SCREEN
======================================== */

function renderMyEntries() {
    const container =
        document.getElementById("myEntriesList");

    if (state.entryHistory.length === 0) {
        container.textContent = "No entries yet.";

        return;
    }

    container.innerHTML = "";

    state.entryHistory.forEach(
        function (entry) {
            const item = document.createElement("div");

            item.className = "history-item";

            item.innerHTML = `
                <strong>${escapeHTML(entry.name)}</strong>
                <p>Type: ${escapeHTML(entry.type)}</p>
                <p>Entry ID: ${escapeHTML(entry.id)}</p>
                <p>Date: ${escapeHTML(entry.date)}</p>
                <p>Status: Demo entry recorded</p>
            `;

            container.appendChild(item);
        }
    );
}


/* ========================================
   POOL WINNERS SCREEN
======================================== */

function renderWinners() {
    const container =
        document.getElementById("winnersList");

    container.innerHTML = `
        <div class="empty-state">
            <span>🏆</span>

            <h3>No winners yet</h3>

            <p>
                Winner selection has not been implemented.
                No prizes have been awarded.
            </p>
        </div>
    `;
}


/* ========================================
   RESET DEMONSTRATION DATA
======================================== */

function resetDemo() {
    const confirmed = confirm(
        "Reset all PoolPlay demonstration data on this device? This will erase your saved entries and demo withdrawal requests."
    );

    if (!confirmed) {
        return;
    }

    state = freshState();

    saveState();

    const withdrawalResult =
        document.getElementById("withdrawalResult");

    if (withdrawalResult) {
        withdrawalResult.textContent = "";
    }

    render();

    showToast("Your demo data has been reset.");
}


document
    .getElementById("resetDemoBtn")
    .addEventListener("click", resetDemo);


document
    .getElementById("settingsResetBtn")
    .addEventListener("click", resetDemo);


/* ========================================
   REFRESH THE APP
======================================== */

function render() {
    if (!state) {
        return;
    }

    renderDashboard();

    renderPools();

    renderWallet();

    renderMyEntries();

    renderWinners();
}



/* ============================================
   POOLPLAY SUPABASE AUTHENTICATION
============================================ */

const poolPlayAuthScreen =
    document.getElementById("authScreen");

const poolPlayLoginPanel =
    document.getElementById("loginPanel");

const poolPlayRegisterPanel =
    document.getElementById("registerPanel");

const poolPlayLoginForm =
    document.getElementById("loginForm");

const poolPlayRegisterForm =
    document.getElementById("registerForm");

const poolPlayAuthMessage =
    document.getElementById("authMessage");

const poolPlayShowRegister =
    document.getElementById("showRegisterBtn");

const poolPlayShowLogin =
    document.getElementById("showLoginBtn");

let poolPlayAuthClient = null;


/* ============================================
   AUTHENTICATION SCREEN CONTROLS
============================================ */

function showPoolPlayAuthMessage(message, isError = false) {

    poolPlayAuthMessage.textContent = message;

    poolPlayAuthMessage.style.color =
        isError ? "#ff7777" : "";

}

function showPoolPlayLogin() {

    poolPlayLoginPanel.hidden = false;
    poolPlayRegisterPanel.hidden = true;

    showPoolPlayAuthMessage("");

}

function showPoolPlayRegister() {

    poolPlayLoginPanel.hidden = true;
    poolPlayRegisterPanel.hidden = false;

    showPoolPlayAuthMessage("");

}


async function loadSharedPoolData() {

    try {
        const { data, error } = await poolPlayAuthClient
            .from("pool_daily_balances")
            .select("pool_id, demo_balance, entry_count")
            .eq("pool_date", todayKey());

        if (error) {
            console.error("Shared pool data error:", error);
            showToast("Could not load shared pool data.");
            return;
        }

        state.sharedPoolBalances = {};
        state.sharedPoolEntries = {};

        data.forEach(function (pool) {
            state.sharedPoolBalances[pool.pool_id] =
                Number(pool.demo_balance) || 0;

            state.sharedPoolEntries[pool.pool_id] =
                Number(pool.entry_count) || 0;
        });

        render();

    } catch (err) {
        console.error("Shared data loading failed:", err);
    }
}


function subscribeToSharedPoolData() {

    if (!poolPlayAuthClient) return;

    if (sharedPoolChannel) {
        poolPlayAuthClient.removeChannel(sharedPoolChannel);
        sharedPoolChannel = null;
    }

    sharedPoolChannel = poolPlayAuthClient
        .channel("poolplay-live-balances")
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "pool_daily_balances",
                filter: "pool_date=eq." + todayKey()
            },
            async function () {
                await loadSharedPoolData();
            }
        )
        .subscribe();
}



async function enterPoolPlayApp() {
    try {
        loadState();
        render();

        await loadUserDemoBalance();
        subscribeToUserBalance();

        await loadSharedPoolData();

        poolPlayAuthScreen.style.display = "none";

    } catch (error) {
        console.error("PoolPlay startup error:", error);
        showToast("Could not load your account. Please try again.");
    }
}


async function loadUserDemoBalance() {
    if (!poolPlayAuthClient) return;

    const { data: { user }, error: authError } =
        await poolPlayAuthClient.auth.getUser();

    if (authError || !user) return;

    const { data, error } = await poolPlayAuthClient
        .from("user_demo_balances")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) {
        console.error("Balance loading error:", error);
        return;
    }

    if (!data) return;

    state.demoBalance = Number(data.balance) || 0;

    renderDashboard();
    renderWallet();
}

let userBalanceChannel = null;

function subscribeToUserBalance() {
    if (!poolPlayAuthClient) return;

    if (userBalanceChannel) {
        poolPlayAuthClient.removeChannel(userBalanceChannel);
    }

    poolPlayAuthClient.auth.getUser().then(({ data, error }) => {
        if (error || !data.user) return;

        userBalanceChannel = poolPlayAuthClient
            .channel("user-demo-balance-" + data.user.id)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "user_demo_balances",
                    filter: "user_id=eq." + data.user.id
                },
                loadUserDemoBalance
            )
            .subscribe();
    });
}

function showPoolPlayAuth() {

    poolPlayAuthScreen.style.display = "grid";

}


/* ============================================
   SWITCH BETWEEN LOGIN AND REGISTER
============================================ */

poolPlayShowRegister.addEventListener(
    "click",
    showPoolPlayRegister
);

poolPlayShowLogin.addEventListener(
    "click",
    showPoolPlayLogin
);


/* ============================================
   INITIALIZE SUPABASE
============================================ */

async function initializePoolPlayAuth() {

    if (
        !window.supabase ||
        !window.POOLPLAY_SUPABASE_URL ||
        !window.POOLPLAY_SUPABASE_KEY ||
        window.POOLPLAY_SUPABASE_KEY ===
            "YOUR_SUPABASE_PUBLISHABLE_KEY"
    ) {

        showPoolPlayAuth();

        showPoolPlayAuthMessage(
            "Supabase configuration is missing. Check supabase-config.js.",
            true
        );

        return;

    }

    poolPlayAuthClient = window.supabase.createClient(
        window.POOLPLAY_SUPABASE_URL,
        window.POOLPLAY_SUPABASE_KEY
    );

    try {

        const {
            data: { session },
            error
        } = await poolPlayAuthClient.auth.getSession();

        if (error) {
            throw error;
        }

        if (session) {

            enterPoolPlayApp();

        } else {

            showPoolPlayAuth();
            showPoolPlayLogin();

        }

        poolPlayAuthClient.auth.onAuthStateChange(
            (event, session) => {

                if (event === "SIGNED_OUT") {

                    showPoolPlayAuth();
                    showPoolPlayLogin();

                }

            }
        );

    } catch (error) {

        showPoolPlayAuth();

        showPoolPlayAuthMessage(
            error.message || "Unable to connect to Supabase.",
            true
        );

    }

}


/* ============================================
   ACCOUNT REGISTRATION
============================================ */

poolPlayRegisterForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();

        if (!poolPlayAuthClient) return;

        const username =
            document.getElementById("registerUsername")
                .value.trim();

        const email =
            document.getElementById("registerEmail")
                .value.trim();

        const password =
            document.getElementById("registerPassword")
                .value;

        const confirmPassword =
            document.getElementById("confirmPassword")
                .value;

        if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {

            showPoolPlayAuthMessage(
                "Username must be 3–20 characters using letters, numbers and underscores.",
                true
            );

            return;

        }

        if (password.length < 8) {

            showPoolPlayAuthMessage(
                "Password must contain at least 8 characters.",
                true
            );

            return;

        }

        if (password !== confirmPassword) {

            showPoolPlayAuthMessage(
                "Your passwords do not match.",
                true
            );

            return;

        }

        const submitButton =
            poolPlayRegisterForm.querySelector(
                'button[type="submit"]'
            );

        submitButton.disabled = true;

        showPoolPlayAuthMessage(
            "Creating your account..."
        );

        try {

            const { data, error } =
                await poolPlayAuthClient.auth.signUp({

                    email: email,
                    password: password,

                    options: {
                        data: {
                            username: username
                        }
                    }

                });

            if (error) {
                throw error;
            }

            if (data.session) {

                enterPoolPlayApp();

            } else {

                showPoolPlayLogin();

                document.getElementById(
                    "loginUsername"
                ).value = username;

                showPoolPlayAuthMessage(
                    "Account created! Check your email for the confirmation link before logging in."
                );

            }

        } catch (error) {

            showPoolPlayAuthMessage(
                error.message || "Account creation failed.",
                true
            );

        } finally {

            submitButton.disabled = false;

        }

    }
);



/* ============================================
   USERNAME LOGIN
============================================ */

poolPlayLoginForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();

        if (!poolPlayAuthClient) {
            showPoolPlayAuthMessage(
                "Supabase is not initialized.",
                true
            );
            return;
        }

        const username =
            document.getElementById("loginUsername")
                .value.trim();

        const password =
            document.getElementById("loginPassword")
                .value;

        const submitButton =
            poolPlayLoginForm.querySelector(
                'button[type="submit"]'
            );

        submitButton.disabled = true;

        showPoolPlayAuthMessage("Logging in...");

        try {

            const supabaseUrl =
                window.POOLPLAY_SUPABASE_URL.replace(/\/+$/, "");

            const supabaseKey =
                window.POOLPLAY_SUPABASE_KEY;

            if (!supabaseUrl || !supabaseKey) {
                throw new Error(
                    "Supabase URL or publishable key is missing."
                );
            }

            const response = await fetch(
                supabaseUrl +
                "/functions/v1/dynamic-api",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "apikey": supabaseKey
                    },

                    body: JSON.stringify({
                        username: username,
                        password: password
                    })
                }
            );

            const responseText = await response.text();

            let data;

            try {
                data = JSON.parse(responseText);
            } catch {
                throw new Error(
                    "Supabase returned an unreadable response. HTTP " +
                    response.status
                );
            }

            if (!response.ok || !data.session) {
                throw new Error(
                    data.error ||
                    "Login failed. HTTP " + response.status
                );
            }

            const { error: sessionError } =
                await poolPlayAuthClient.auth.setSession({
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token
                });

            if (sessionError) {
                throw sessionError;
            }

            enterPoolPlayApp();

        } catch (error) {

            console.error(
                "PoolPlay login error:",
                error
            );

            showPoolPlayAuthMessage(
                error.message || "Login failed.",
                true
            );

        } finally {

            submitButton.disabled = false;

        }

    }
);



/* ============================================
   START POOLPLAY
============================================ */

initializePoolPlayAuth();
