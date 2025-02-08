export function insertNavigation() {
    // Top Navigation
    document.body.insertAdjacentHTML('afterbegin', `
        <header>
            <div class="logo"><i class="fas fa-gavel"></i>THE LEGAL LIBRARY</div>
            <button class="menu-button" id="hamburgerMenu"><i class="fas fa-bars"></i></button>
            <ul class="dropdown-menu" id="menuOptions">
                <li><a href="Home.html">Home</a></li>
                <li><a href="library.html">Library</a></li>
                <li><a href="cart.html">Cart</a></li>
            </ul>
        </header>
    `);

    // Bottom Navigation
    document.body.insertAdjacentHTML('beforeend', `
        <nav class="bottom-nav">
            <a href="Home.html" class="nav-item">
                <span class="nav-icon">🏠</span>
                <span>Home</span>
            </a>
            <a href="library.html" class="nav-item">
                <span class="nav-icon">📚</span>
                <span>Library</span>
            </a>
            <a href="cart.html" class="nav-item">
                <span class="nav-icon">🛒</span>
                <span>Cart</span>
            </a>
        </nav>

        <div id="chatbot-icon" onclick="toggleChatbot()">
            📖
        </div>
    `);

    // Initialize hamburger menu
    document.getElementById('hamburgerMenu').addEventListener('click', () => {
        document.getElementById('menuOptions').classList.toggle('active');
    });
} 