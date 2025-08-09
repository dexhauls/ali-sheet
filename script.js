document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle functionality
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const body = document.body;
    
    if (menuToggle) {
        // Create overlay element
        const overlay = document.createElement('div');
        overlay.className = 'menu-overlay';
        body.appendChild(overlay);
        
        // Toggle menu when hamburger icon is clicked
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
            body.classList.toggle('menu-open');
        });
        
        // Close menu when clicking outside (on the overlay)
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            body.classList.remove('menu-open');
        });
        
        // Check if URL has menu=open parameter
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('menu') === 'open') {
            sidebar.classList.add('active');
            overlay.classList.add('active');
            body.classList.add('menu-open');
            // Clean URL without reloading
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
    
    // Reset sidebar spacing
    if (sidebar) {
        // Reset any default browser spacing
        const sidebarNav = sidebar.querySelector('nav');
        if (sidebarNav) {
            const sidebarList = sidebarNav.querySelector('ul');
            if (sidebarList) {
                sidebarList.style.margin = '0';
                sidebarList.style.padding = '0';
                sidebarList.style.listStyle = 'none';
                
                // Apply spacing to all direct children
                Array.from(sidebarList.children).forEach(item => {
                    if (item.classList.contains('divider')) {
                        item.style.margin = '8px 0';
                    } else if (item.classList.contains('sidebar-heading')) {
                        item.style.margin = '10px 0 4px';
                    } else if (!item.previousElementSibling || 
                              item.previousElementSibling.classList.contains('sidebar-heading') ||
                              item.previousElementSibling.classList.contains('divider')) {
                        item.style.marginTop = '0';
                    }
                });
            }
        }
    }
    
    // Initialize back-to-top button
    initBackToTopButton();
    
    // Initialize language and currency settings
    initializeSettings();
    
    // Initialize adblock detection
    initializeAdblockDetection();
    
    // Create toast container
    const toastContainer = document.createElement('ol');
    toastContainer.className = 'toast-container';
    toastContainer.setAttribute('tabindex', '-1');
    document.body.appendChild(toastContainer);

    // Generate a single random toast notification
    generateRandomToast();
    
    // Show loading indicator while fetching products
    const productsGrid = document.querySelector('.products-grid');
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = '<div class="loading-spinner"></div>';
    productsGrid.innerHTML = '';
    productsGrid.appendChild(loadingIndicator);
    
    // Style the sidebar sections (Pages and Socials)
    styleSidebarSections();
    
    // Add report button styles for dead link reporting
    addReportButtonStyles();
    
    // Fetch products from the API instead of items.json
    console.log('Fetching products from API...');
    fetch('https://api.dexfinds.com/db/ali')
        .then(response => {
            console.log('API Response status:', response.status);
            console.log('API Response headers:', response.headers);
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            // Remove loading indicator
            document.querySelector('.loading-indicator')?.remove();
            
            // Check if data is valid
            if (!data || !Array.isArray(data) || data.length === 0) {
                console.error('No products data returned from API or invalid format:', data);
                productsGrid.innerHTML = `<div class="error-message">No products available. Please try again later.</div>`;
                return;
            }
            
            console.log(`Loaded ${data.length} products from API`);
            
            // Debug categories structure
            const sampleProducts = data.slice(0, 5);
            console.log('Sample products with categories:', sampleProducts.map(p => ({
                name: p.name,
                categories: [
                    p['category[0]'] || '',
                    p['category[1]'] || '',
                    p['category[2]'] || ''
                ].filter(cat => cat !== '')
            })));
            
            // Store products globally for filtering
            window.allProducts = data;
            
            // Extract unique categories and display them
            fetchCategories(data);
            
            // Display all products initially
            displayProducts(data);
            
            // Initialize search functionality
            initializeSearch();
        })
        .catch(error => {
            console.error('Error fetching products:', error);
            // Remove loading indicator
            document.querySelector('.loading-indicator')?.remove();
            productsGrid.innerHTML = `<div class="error-message">Failed to load products: ${error.message}. Please try again later.</div>`;
        });

    // Add additional initialization for lazy loading scroll detection
    window.addEventListener('scroll', handleLazyLoad);
    
    // Initialize custom agent dropdown
    const agentDropdownBtn = document.getElementById('agent-dropdown-btn');
    const agentDropdownMenu = document.getElementById('agent-dropdown-menu');
    const agentSelected = document.querySelector('.agent-selected');
    const agentOptions = document.querySelectorAll('.agent-option');
    
    if (agentDropdownBtn && agentDropdownMenu) {
        // Load saved agent or default to kakobuy
        const savedAgent = localStorage.getItem('agent') || 'kakobuy';
        updateSelectedAgent(savedAgent);
        
        // Toggle dropdown on button click
        agentDropdownBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            agentDropdownMenu.classList.toggle('active');
            
            // Rotate dropdown icon
            const icon = this.querySelector('.dropdown-icon');
            if (icon) {
                icon.style.transform = agentDropdownMenu.classList.contains('active') 
                    ? 'rotate(180deg)' 
                    : 'rotate(0deg)';
            }
        });
        
        // Handle option selection
        agentOptions.forEach(option => {
            option.addEventListener('click', function() {
                const agent = this.getAttribute('data-agent');
                updateSelectedAgent(agent);
                updateMobileSelectedAgent(agent); // Update mobile dropdown too
                localStorage.setItem('agent', agent);
                
                // Close dropdown
                agentDropdownMenu.classList.remove('active');
                const icon = agentDropdownBtn.querySelector('.dropdown-icon');
                if (icon) {
                    icon.style.transform = 'rotate(0deg)';
                }
                
                // Redraw products with new agent links
                if (window.allProducts) displayProducts(window.allProducts);
            });
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!agentDropdownBtn.contains(e.target) && !agentDropdownMenu.contains(e.target)) {
                agentDropdownMenu.classList.remove('active');
                const icon = agentDropdownBtn.querySelector('.dropdown-icon');
                if (icon) {
                    icon.style.transform = 'rotate(0deg)';
                }
            }
        });
        
        // Close dropdown on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && agentDropdownMenu.classList.contains('active')) {
                agentDropdownMenu.classList.remove('active');
                const icon = agentDropdownBtn.querySelector('.dropdown-icon');
                if (icon) {
                    icon.style.transform = 'rotate(0deg)';
                }
            }
        });
    }
    
    function updateSelectedAgent(agent) {
        // Update the selected text
        if (agentSelected) {
            agentSelected.textContent = getAgentDisplayName(agent);
        }
        
        // Update selected state of options
        agentOptions.forEach(option => {
            option.classList.remove('selected');
            if (option.getAttribute('data-agent') === agent) {
                option.classList.add('selected');
            }
        });
    }
    
    function getAgentDisplayName(agent) {
        const agentNames = {
            'kakobuy': 'KakoBuy',
            'superbuy': 'Superbuy',
            'basetao': 'Basetao',
            'mulebuy': 'Mulebuy',
            'joyagoo': 'Joyagoo',
            'cnfans': 'CNFans',
            'acbuy': 'ACBuy',
            'eastmallbuy': 'EastmallBuy',
            'orientdig': 'OrientDig',
            'sifubuy': 'SifuBuy',
            'loongbuy': 'LoongBuy',
            'itaobuy': 'ITaoBuy',
            'lovegobuy': 'LoveGoBuy',
            'oopbuy': 'OopBuy'
        };
        return agentNames[agent] || agent;
    }
    
    // Initialize mobile agent dropdown
    const mobileAgentDropdownBtn = document.getElementById('mobile-agent-dropdown-btn');
    const mobileAgentDropdownMenu = document.getElementById('mobile-agent-dropdown-menu');
    const mobileAgentSelected = document.querySelector('.mobile-agent-selected');
    const mobileAgentOptions = document.querySelectorAll('.mobile-agent-option');
    
    function updateMobileSelectedAgent(agent) {
        // Update the selected text
        if (mobileAgentSelected) {
            mobileAgentSelected.textContent = getAgentDisplayName(agent);
        }
        
        // Update selected state of options
        mobileAgentOptions.forEach(option => {
            option.classList.remove('selected');
            if (option.getAttribute('data-agent') === agent) {
                option.classList.add('selected');
            }
        });
    }
    
    if (mobileAgentDropdownBtn && mobileAgentDropdownMenu) {
        // Load saved agent or default to kakobuy
        const savedAgent = localStorage.getItem('agent') || 'kakobuy';
        updateMobileSelectedAgent(savedAgent);
        
        // Toggle dropdown on button click
        mobileAgentDropdownBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            mobileAgentDropdownMenu.classList.toggle('active');
            
            // Rotate dropdown icon
            const icon = this.querySelector('.dropdown-icon');
            if (icon) {
                icon.style.transform = mobileAgentDropdownMenu.classList.contains('active') 
                    ? 'rotate(180deg)' 
                    : 'rotate(0deg)';
            }
        });
        
        // Handle option selection
        mobileAgentOptions.forEach(option => {
            option.addEventListener('click', function() {
                const agent = this.getAttribute('data-agent');
                updateMobileSelectedAgent(agent);
                updateSelectedAgent(agent); // Update desktop dropdown too
                localStorage.setItem('agent', agent);
                
                // Close dropdown
                mobileAgentDropdownMenu.classList.remove('active');
                const icon = mobileAgentDropdownBtn.querySelector('.dropdown-icon');
                if (icon) {
                    icon.style.transform = 'rotate(0deg)';
                }
                
                // Redraw products with new agent links
                if (window.allProducts) displayProducts(window.allProducts);
            });
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!mobileAgentDropdownBtn.contains(e.target) && !mobileAgentDropdownMenu.contains(e.target)) {
                mobileAgentDropdownMenu.classList.remove('active');
                const icon = mobileAgentDropdownBtn.querySelector('.dropdown-icon');
                if (icon) {
                    icon.style.transform = 'rotate(0deg)';
                }
            }
        });
        
        // Close dropdown on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && mobileAgentDropdownMenu.classList.contains('active')) {
                mobileAgentDropdownMenu.classList.remove('active');
                const icon = mobileAgentDropdownBtn.querySelector('.dropdown-icon');
                if (icon) {
                    icon.style.transform = 'rotate(0deg)';
                }
            }
        });
    }
});

// Currency conversion rates
const conversionRates = {
    EUR: 1,
    USD: 1.08, // 1 EUR = 1.08 USD
    CZK: 25.2  // 1 EUR = 25.2 CZK
};

// Language translations
const translations = {
    en: {
        'checkout': 'Check out',
        'added-to-cart': 'Added to cart',
        'purchase-notification': 'New Purchase',
        'stock-notification': 'Stock Update',
        'sale-notification': 'Sale Alert',
        'shipping-notification': 'Shipping Info',
        'collection-notification': 'New Collection',
        'tutorial': 'Tutorial',
        'faq': 'FAQ',
        'filters': 'Filters',
        'pages': 'Pages',
        'socials': 'Socials',
        'search': 'Search...'
    }
};

// Global variables for lazy loading
let currentDisplayCount = 0;
let itemsPerPage = 25;
let currentProductsToDisplay = [];

function initializeSettings() {
    // Initialize language and currency settings from localStorage or defaults
    localStorage.setItem('language', 'en'); // Always set to English
    const currentCurrency = localStorage.getItem('currency') || 'EUR';
    const currencySymbol = localStorage.getItem('currencySymbol') || '€';
    
    // Set initial language and currency
    setCurrency(currentCurrency, currencySymbol);
    
    // Set up dropdown toggles
    document.querySelectorAll('.currency-btn').forEach(button => {
        button.addEventListener('click', function() {
            const dropdown = this.closest('.dropdown-container').querySelector('.dropdown-menu');
            dropdown.classList.toggle('active');
            
            // Close other dropdowns
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                if (menu !== dropdown && menu.classList.contains('active')) {
                    menu.classList.remove('active');
                }
            });
        });
    });
    
    // Click outside to close dropdowns
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.dropdown-container')) {
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                menu.classList.remove('active');
            });
        }
    });
    
    // Currency selection
    document.querySelectorAll('.currency-menu .dropdown-item').forEach(item => {
        item.addEventListener('click', function() {
            const currency = this.getAttribute('data-currency');
            const symbol = this.getAttribute('data-symbol');
            setCurrency(currency, symbol);
            document.querySelector('.currency-menu').classList.remove('active');
        });
    });
}

function setCurrency(currency, symbol) {
    // Save currency preference
    localStorage.setItem('currency', currency);
    localStorage.setItem('currencySymbol', symbol);
    
    // Update currency button
    const currencyBtn = document.querySelector('.currency-btn');
    const currencySymbolElem = document.querySelector('.currency-symbol');
    const currencyTextElem = document.querySelector('.currency-text');
    
    currencySymbolElem.textContent = symbol;
    currencyTextElem.textContent = currency;
    
    // Update prices
    updateAllPrices();
}

function updateAllPrices() {
    const currentCurrency = localStorage.getItem('currency') || 'EUR';
    const symbol = localStorage.getItem('currencySymbol') || '€';
    
    document.querySelectorAll('.product-price').forEach(priceElem => {
        const basePrice = parseFloat(priceElem.getAttribute('data-base-price') || priceElem.textContent.replace(/[^0-9.]/g, ''));
        const convertedPrice = convertPrice(basePrice, currentCurrency);
        
        if (currentCurrency === 'CZK') {
            priceElem.textContent = `${Math.round(convertedPrice)} ${symbol}`;
        } else {
            priceElem.textContent = `${symbol}${convertedPrice.toFixed(2)}`;
        }
    });
}

function convertPrice(priceInEUR, targetCurrency) {
    return priceInEUR * conversionRates[targetCurrency];
}

// Initialize search functionality
function initializeSearch() {
    const searchInput = document.querySelector('.search-input');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        
        // Get the active category if any
        let activeCategory = null;
        const activeCategoryElement = document.querySelector('.category-item.active');
        
        if (activeCategoryElement) {
            const categoryName = activeCategoryElement.querySelector('.category-name');
            if (categoryName && categoryName.textContent !== 'All Products') {
                activeCategory = categoryName.textContent;
            }
        }
        
        // Also check for active subcategory
        const activeSubcategoryElement = document.querySelector('.subcategory-item.active');
        if (activeSubcategoryElement && activeSubcategoryElement.dataset.category) {
            activeCategory = activeSubcategoryElement.dataset.category; // This will be in format "Category:Subcategory"
        }
        
        // Apply search filter
        filterProducts(searchTerm, activeCategory);
    });
}

// Filter products based on search term and/or active category
function filterProducts(searchTerm = '', activeCategory = null) {
    if (!window.allProducts) return;
    
    console.log(`Filtering products with term: "${searchTerm}", category: "${activeCategory}"`);
    
    const filteredProducts = window.allProducts.filter(product => {
        // Filter by category if one is active
        if (activeCategory) {
            // Create a proper category array from the separate fields
            const productCategories = [
                product['category[0]'] || '',
                product['category[1]'] || '',
                product['category[2]'] || ''
            ].filter(cat => cat !== ''); // Remove empty categories
            
            // If product has no categories, don't include it when filtering by category
            if (productCategories.length === 0) return false;
            
            // Check if we're filtering by subcategory (format: "Category:Subcategory")
            if (activeCategory.includes(':')) {
                const [mainCategory, subcategory] = activeCategory.split(':');
                
                // Main category check
                const mainCategoryMatch = product['category[0]'] && 
                    product['category[0]'].toLowerCase() === mainCategory.toLowerCase();
                
                // Subcategory check
                const subcategoryMatch = product['category[1]'] && 
                    product['category[1]'].toLowerCase() === subcategory.toLowerCase();
                
                // Match only if both main category and subcategory match
                if (!(mainCategoryMatch && subcategoryMatch)) return false;
            } else {
                // Regular category filtering (match against any of the category fields)
                const categoryMatch = productCategories.some(category => 
                    category.toLowerCase().includes(activeCategory.toLowerCase())
                );
                
                // If no category match, exclude the product
                if (!categoryMatch) return false;
            }
        }
        
        // If there's no search term, keep the product (only filtered by category at this point)
        if (!searchTerm) return true;
        
        // Search in name (if it exists)
        const nameMatch = product.name && 
            product.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Search in brand (if it exists)
        const brandMatch = product.brand && 
            product.brand.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Search in categories (if they exist)
        let categoryMatch = false;
        const categoryFields = [
            product['category[0]'] || '',
            product['category[1]'] || '',
            product['category[2]'] || ''
        ];
        
        categoryMatch = categoryFields.some(category => 
            category && category.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        // Return true if any field matches
        return nameMatch || brandMatch || categoryMatch;
    });
    
    console.log(`Found ${filteredProducts.length} products matching the criteria`);
    
    // Update active category visual indicator
    updateCategoryActiveState(activeCategory);
    
    // Reset current display count when filters change
    currentDisplayCount = 0;
    
    // Display filtered products
    displayProducts(filteredProducts);
}

// Update category active state visually
function updateCategoryActiveState(activeCategory) {
    // Remove active class from all category and subcategory items
    document.querySelectorAll('.category-item, .subcategory-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // If there's no active category, set "All" as active
    if (!activeCategory) {
        const allCategory = document.querySelector('.category-item:first-child');
        if (allCategory) allCategory.classList.add('active');
        return;
    }
    
    // Check if we're dealing with a subcategory
    if (activeCategory.includes(':')) {
        const [mainCategory, subcategory] = activeCategory.split(':');
        
        // Find and open the parent category dropdown
        document.querySelectorAll('.category-content').forEach(content => {
            const categoryName = content.querySelector('.category-name');
            if (categoryName && categoryName.textContent === mainCategory) {
                // Open the dropdown
                const categoryItem = content.closest('.category-item');
                const dropdown = categoryItem.querySelector('.subcategory-list');
                const toggle = categoryItem.querySelector('.dropdown-toggle');
                
                if (dropdown) {
                    dropdown.style.display = 'block';
                    if (toggle) toggle.innerHTML = '-';
                }
                
                // Find and activate the subcategory
                const subcategoryItems = categoryItem.querySelectorAll('.subcategory-item');
                subcategoryItems.forEach(item => {
                    const subcategoryName = item.querySelector('.subcategory-name');
                    if (subcategoryName && subcategoryName.textContent === subcategory) {
                        item.classList.add('active');
                    }
                });
            }
        });
    } else {
        // Find and activate the main category
        document.querySelectorAll('.category-content').forEach(content => {
            const categoryName = content.querySelector('.category-name');
            if (categoryName && categoryName.textContent === activeCategory) {
                content.closest('.category-item').classList.add('active');
            }
        });
    }
}

// Function to fetch and display unique categories from products
function fetchCategories(products) {
    // Define fixed categories with subcategories
    const categories = [
      {
        name: 'Tops',
        subcategories: ['Tees', 'Hoodies', 'Jackets', 'Vests', 'Sweaters', 'Jerseys', 'Tracksuits']
      },
      {
        name: 'Bottoms',
        subcategories: ['Jeans', 'Cargos', 'Sweatpants', 'Shorts']
      },
      {
        name: 'Shoes',
        subcategories: [
            'Air Jordan', 'Yeezy', 'Balenciaga', 'Nike', 'Adidas', 'New Balance',
            'Louis Vuitton', 'Gucci', 'Dior', 'McQueen', 'Lanvin', 'Rick Owens',
            'OffWhite', 'Amiri', 'Golden Goose',
            'Christian Louboutin', 'Moncler', 'Maison Margiela',
            'Bape', 'Ugg', 'Timberland', 'Maison Mihara Yasuhiro'
        ]
      },
      {
        name: 'Accessories',
        subcategories: [
          'Wallets', 'Belts', 'Glasses', 'Gloves', 'Hats', 'Beanies', 
          'Facemasks', 'Keychains', 'Socks', 'Underwear', 'Phone Cases', 
          'Air Pod Cases', 'Ties'
        ]
      },
      {
        name: 'Jewelry',
        subcategories: ['Bracelets', 'Necklaces', 'Rings', 'Watches']
      },
      {
        name: 'Bags',
        subcategories: ['Shoulder Bags', 'Backpacks', 'Duffle Bags', 'Tote Bags']
      },
      {
        name: 'Tech',
        subcategories: []
      },
      {
        name: 'Room Decorations',
        subcategories: ['Figures', 'Pillows', 'Plushes', 'Rugs', 'Posters', 'Lego', 'Other']
      }
    ];
    
    // Display the fixed categories in the sidebar
    displayCategories(categories);
}

// Function to display categories in the sidebar
function displayCategories(categories) {
    const categoriesContainer = document.querySelector('.categories-container');
    if (!categoriesContainer) {
        console.error('Categories container not found in the DOM');
        return;
    }
    
    // Clear existing categories if any
    categoriesContainer.innerHTML = '';
    
    const categoryList = document.createElement('ul');
    categoryList.className = 'category-list';
    
    // Add "All" category first
    const allCategoryItem = document.createElement('li');
    allCategoryItem.className = 'category-item active';
    allCategoryItem.innerHTML = `
        <div class="category-content all-category">
            <span class="category-name">All Products</span>
            <span class="category-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
            </span>
        </div>
    `;
    allCategoryItem.addEventListener('click', () => {
        // Get current search term
        const searchTerm = document.querySelector('.search-input')?.value.toLowerCase().trim() || '';
        
        // Clear any active category filter but keep search term
        filterProducts(searchTerm, null);
        
        // Update active state
        document.querySelectorAll('.category-item, .subcategory-item').forEach(item => {
            item.classList.remove('active');
            item.classList.remove('parent-active');
            
            // Also close any open category dropdowns
            const dropdown = item.querySelector('.subcategory-list');
            const toggle = item.querySelector('.dropdown-toggle');
            if (dropdown) {
                dropdown.style.display = 'none';
                if (toggle) toggle.innerHTML = '+';
                item.classList.remove('expanded');
            }
        });
        
        allCategoryItem.classList.add('active');
    });
    categoryList.appendChild(allCategoryItem);
    
    // Function to close all expanded categories except the current one
    const closeOtherCategories = (currentCategoryItem) => {
        document.querySelectorAll('.category-item.expanded').forEach(item => {
            if (item !== currentCategoryItem) {
                const dropdown = item.querySelector('.subcategory-list');
                const toggle = item.querySelector('.dropdown-toggle');
                if (dropdown) {
                    dropdown.style.display = 'none';
                    if (toggle) toggle.innerHTML = '+';
                    item.classList.remove('expanded');
                }
            }
        });
    };
    
    // Add the main categories with dropdowns
    categories.forEach(category => {
        // Skip empty categories
        if (!category.name) return;
        
        const categoryItem = document.createElement('li');
        categoryItem.className = 'category-item';
        categoryItem.dataset.category = category.name;
        
        // Get icon for this category
        const icon = getCategoryIcon(category.name);
        
        // Create the main category with dropdown toggle if it has subcategories
        const hasSubcategories = category.subcategories && category.subcategories.length > 0;
        
        // Create category content
        const categoryContent = document.createElement('div');
        categoryContent.className = 'category-content';
        
        // Add category icon and name
        categoryContent.innerHTML = `
            <div class="category-left">
                <span class="category-icon">${icon}</span>
                <span class="category-name">${category.name}</span>
            </div>
            ${hasSubcategories ? '<span class="dropdown-toggle">+</span>' : ''}
        `;
        
        categoryItem.appendChild(categoryContent);
        
        // Create subcategories container if there are subcategories
        if (hasSubcategories) {
            const subcategoryList = document.createElement('ul');
            subcategoryList.className = 'subcategory-list';
            subcategoryList.style.display = 'none'; // Hidden by default
            
            // Add subcategories
            category.subcategories.forEach(subcategory => {
                const subcategoryItem = document.createElement('li');
                subcategoryItem.className = 'subcategory-item';
                subcategoryItem.dataset.category = `${category.name}:${subcategory}`;
                subcategoryItem.innerHTML = `
                    <span class="subcategory-dot">•</span>
                    <span class="subcategory-name">${subcategory}</span>
                `;
                
                // Make the entire subcategory item and all its child elements clickable
                const clickHandler = (e) => {
                    e.stopPropagation(); // Prevent triggering parent events
                    
                    // Get current search term
                    const searchTerm = document.querySelector('.search-input')?.value.toLowerCase().trim() || '';
                    
                    // Apply filtering with main category and subcategory using exact format
                    // This uses "Category:Subcategory" format which our filterProducts function will parse
                    filterProducts(searchTerm, `${category.name}:${subcategory}`);
                    
                    // Close all other category dropdowns
                    closeOtherCategories(categoryItem);
                    
                    // Update active state
                    document.querySelectorAll('.category-item, .subcategory-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    subcategoryItem.classList.add('active');
                    
                    // Also add active class to parent category
                    const parentCategory = subcategoryItem.closest('.category-item');
                    if (parentCategory) {
                        parentCategory.classList.add('parent-active');
                    }
                };

                // Add click event for filtering by subcategory
                subcategoryItem.addEventListener('click', clickHandler);

                // Also add click handlers to child elements to ensure complete coverage
                subcategoryItem.querySelector('.subcategory-dot').addEventListener('click', clickHandler);
                subcategoryItem.querySelector('.subcategory-name').addEventListener('click', clickHandler);
                
                subcategoryList.appendChild(subcategoryItem);
            });
            
            categoryItem.appendChild(subcategoryList);
            
            // Split the category click and dropdown toggle functionality
            categoryContent.addEventListener('click', (e) => {
                // Check if clicked on the dropdown toggle
                if (e.target.classList.contains('dropdown-toggle') || 
                    e.target.closest('.dropdown-toggle')) {
                    // Toggle dropdown only
                    const dropdown = categoryItem.querySelector('.subcategory-list');
                    const toggle = categoryItem.querySelector('.dropdown-toggle');
                    
                    if (dropdown.style.display === 'none') {
                        // Close all other categories first
                        closeOtherCategories(categoryItem);
                        
                        // Then open this one
                        dropdown.style.display = 'block';
                        toggle.innerHTML = '-';
                        categoryItem.classList.add('expanded');
                    } else {
                        dropdown.style.display = 'none';
                        toggle.innerHTML = '+';
                        categoryItem.classList.remove('expanded');
                    }
                } else {
                    // Main category click - filter by this category
                    const searchTerm = document.querySelector('.search-input')?.value.toLowerCase().trim() || '';
                    filterProducts(searchTerm, category.name);
                    
                    // Close all other category dropdowns
                    closeOtherCategories(categoryItem);
                    
                    // Update active state
                    document.querySelectorAll('.category-item, .subcategory-item').forEach(item => {
                        item.classList.remove('active');
                        item.classList.remove('parent-active');
                    });
                    categoryItem.classList.add('active');
                    
                    // Open dropdown if it exists
                    const dropdown = categoryItem.querySelector('.subcategory-list');
                    const toggle = categoryItem.querySelector('.dropdown-toggle');
                    if (dropdown) {
                        dropdown.style.display = 'block';
                        if (toggle) toggle.innerHTML = '-';
                        categoryItem.classList.add('expanded');
                    }
                }
            });
        } else {
            // For categories without subcategories, just filter by the main category
            categoryContent.addEventListener('click', () => {
                const searchTerm = document.querySelector('.search-input')?.value.toLowerCase().trim() || '';
                filterProducts(searchTerm, category.name);
                
                // Close all other category dropdowns
                closeOtherCategories(categoryItem);
                
                // Update active state
                document.querySelectorAll('.category-item, .subcategory-item').forEach(item => {
                    item.classList.remove('active');
                    item.classList.remove('parent-active');
                });
                categoryItem.classList.add('active');
            });
        }
        
        categoryList.appendChild(categoryItem);
    });
    
    categoriesContainer.appendChild(categoryList);
    
    // Add CSS for the category list
    const style = document.createElement('style');
    style.textContent = `
        .category-list {
            list-style: none;
            padding: 0;
            margin: 0;
            font-family: 'Inter', sans-serif;
        }
        
        .category-item {
            margin-bottom: 2px;
            cursor: pointer;
            border-radius: 6px;
            transition: all 0.2s ease;
        }
        
        .category-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 5px 12px;
            border-radius: 6px;
            transition: all 0.15s ease;
        }
        
        .category-left {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;
        }
        
        .category-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(255, 255, 255, 0.7);
            width: 16px;
            height: 16px;
        }
        
        .category-icon svg {
            width: 14px;
            height: 14px;
        }
        
        .category-name {
            font-size: 13px;
            font-weight: 500;
        }
        
        .dropdown-toggle {
            font-size: 12px;
            font-weight: 700;
            color: rgba(255, 255, 255, 0.7);
            width: 14px;
            height: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        
        .category-content:hover {
            background-color: rgba(255, 255, 255, 0.1);
        }
        
        .category-item.active > .category-content,
        .category-item.expanded > .category-content,
        .category-item.parent-active > .category-content {
            background-color: rgba(255, 255, 255, 0.15);
        }
        
        .category-item.active > .category-content .category-name,
        .category-item.parent-active > .category-content .category-name {
            font-weight: 600;
        }
        
        .subcategory-list {
            list-style: none !important;
            padding: 2px 0 2px 32px !important;
            margin: 2px 0 0 0 !important;
            font-size: 12px !important;
            border-left: 1px solid rgba(255, 255, 255, 0.15) !important;
            margin-left: 16px !important;
        }
        
        .subcategory-item {
            padding: 3px 10px !important;
            margin-bottom: 1px !important;
            border-radius: 4px !important;
            cursor: pointer !important;
            display: flex !important;
            align-items: center !important;
            gap: 4px !important;
            width: 100% !important;
            box-sizing: border-box !important;
            font-size: 12px !important;
        }
        
        .subcategory-dot {
            color: rgba(255, 255, 255, 0.5) !important;
            display: inline-block !important;
            width: 10px !important;
            flex-shrink: 0 !important;
        }
        
        .subcategory-name {
            flex-grow: 1 !important;
        }
        
        .subcategory-item:hover {
            background-color: rgba(255, 255, 255, 0.1) !important;
        }
        
        .subcategory-item.active {
            background-color: rgba(255, 255, 255, 0.2) !important;
            font-weight: 500 !important;
        }
        
        .all-category {
            background-color: rgba(255, 255, 255, 0.15);
            font-weight: 600;
        }
        
        /* Disable selection on category clicks */
        .category-list, .category-item, .subcategory-item, 
        .category-content, .category-left, .category-name,
        .dropdown-toggle, .subcategory-name {
            user-select: none;
        }
    `;
    document.head.appendChild(style);
}

// Function to get appropriate icon for each category
function getCategoryIcon(categoryName) {
    // Map of category names to SVG icons
    const icons = {
        'Tops': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"></path>
                </svg>`,
        'Bottoms': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 2v20h4.3L12 8l1.7 14H18V2Z"></path>
                </svg>`,
        'Shoes': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 14h20v2H2zm1.5-1L7 9h10l3.5 4zm6.5-4V3h2v6"></path>
                </svg>`,
        'Accessories': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="7"></circle>
                    <polyline points="12 9 12 12 13.5 13.5"></polyline>
                    <path d="M16.51 17.35l-.35 3.83a2 2 0 0 1-2 1.82H9.83a2 2 0 0 1-2-1.82l-.35-3.83"></path>
                    <path d="M16.51 6.65l-.35-3.83a2 2 0 0 0-2-1.82H9.83a2 2 0 0 0-2 1.82l-.35 3.83"></path>
                </svg>`,
        'Jewelry': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="16" r="6"></circle>
                    <path d="M12 10v-4l3 2-3 2"></path>
                    <path d="M9 8l3-2"></path>
                </svg>`,
        'Bags': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"></path>
                    <rect x="3" y="6" width="18" height="14" rx="2"></rect>
                    <path d="M3 14h18"></path>
                </svg>`,
        'Tech': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                    <line x1="12" y1="18" x2="12.01" y2="18"></line>
                </svg>`,
        'Room Decorations': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 7v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7"></path>
                    <path d="M5 5h14"></path>
                    <path d="M7 3h10"></path>
                    <path d="M9 13h.01"></path>
                    <path d="M15 13h.01"></path>
                    <path d="M12 17v-4"></path>
                </svg>`
    };
    
    // Return matching icon or default icon if no match
    return icons[categoryName] || `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M20 7h-3a2 2 0 0 0-2 2v9"></path>
                                    <path d="M14 11h6"></path>
                                    <path d="M4 17a3 3 0 0 0 3 3c2 0 4-1 5-2.5a3 3 0 0 0 6 0v-2"></path>
                                    <path d="M4 14v-3a2 2 0 0 1 2-2h1"></path>
                                    <path d="M11 7H7"></path>
                                </svg>`;
}

function displayProducts(products) {
    const productsGrid = document.querySelector('.products-grid');
    const currentCurrency = localStorage.getItem('currency') || 'EUR';
    const symbol = localStorage.getItem('currencySymbol') || '€';
    
    // Store the complete filtered products list for lazy loading
    currentProductsToDisplay = products;
    
    // Reset product count when filter changes
    if (products !== currentProductsToDisplay) {
        currentDisplayCount = 0;
    }
    
    // Clear any existing content only on first load or filter change
    if (currentDisplayCount === 0) {
        productsGrid.innerHTML = '';
    }
    
    // Calculate how many products to display now
    const productsToShow = currentProductsToDisplay.slice(currentDisplayCount, currentDisplayCount + itemsPerPage);
    currentDisplayCount += productsToShow.length;
    
    // Generate HTML for each product in this batch
    productsToShow.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product';
        
        const convertedPrice = convertPrice(product.price, currentCurrency);
        let formattedPrice;
        
        if (currentCurrency === 'CZK') {
            formattedPrice = `${Math.round(convertedPrice)} ${symbol}`;
        } else {
            formattedPrice = `${symbol}${convertedPrice.toFixed(2)}`;
        }
        
        // Use original link for display, affiliate link will be handled by click events
        const productLink = product.link || product.rawlink || '#';

        productElement.innerHTML = `
            <div class="product-container">
                <button class="report-dead-link" data-product-id="${product._id || ''}" data-product-name="${product.name}" data-product-link="${productLink}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                        <path d="M12 9v4"></path>
                        <path d="M12 17h.01"></path>
                    </svg>
                </button>
                <a href="#" class="product-image" target="_blank" rel="noopener noreferrer" data-product-id="${product._id}">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                </a>
            </div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-price" data-base-price="${product.price}">${formattedPrice}</div>
                <button class="checkout-btn" data-product-link="${productLink}" data-product-id="${product._id}">${translations.en['checkout']}</button>
            </div>
        `;
        
        productsGrid.appendChild(productElement);
    });
    
    // Add click event listeners AFTER all products are added to DOM
    // Add click event listeners to checkout buttons
    console.log('Adding event listeners to checkout buttons...');
    const checkoutButtons = document.querySelectorAll('.checkout-btn');
    console.log('Found checkout buttons:', checkoutButtons.length);
    checkoutButtons.forEach(button => {
        button.addEventListener('click', async function(e) {
            console.log('Checkout button clicked!');
            e.preventDefault();
            const productId = this.getAttribute('data-product-id');
            console.log('Product ID:', productId);
            console.log('All products:', window.allProducts);
            const agent = localStorage.getItem('agent') || 'kakobuy';
            // Najdi produkt podle id - zkus různé možnosti
            const product = window.allProducts.find(p => 
                p._id === productId || 
                p.id === productId || 
                p._id === parseInt(productId) || 
                p.id === parseInt(productId)
            );
            console.log('Found product:', product);
            if (!product || !product.link) {
                console.log('No product or link found');
                return;
            }

            // Zavolej API pro konverzi odkazu
            try {
                const apiUrl = `https://affiliate.repsheet.net/convert?link=${encodeURIComponent(product.link)}`;
                console.log('Calling API:', apiUrl);
                const response = await fetch(apiUrl);
                const data = await response.json();
                let affiliateLink = data[agent] || data.kakobuy || product.link;
                console.log('Opening affiliate link:', affiliateLink);
                window.open(affiliateLink, '_blank', 'noopener,noreferrer');
            } catch (err) {
                console.log('Error:', err);
                // Fallback: otevři rawlink
                window.open(product.link, '_blank', 'noopener,noreferrer');
            }
        });
    });
    
    // Add click event listeners to product images
    console.log('Adding event listeners to product images...');
    const productImages = document.querySelectorAll('.product-image');
    console.log('Found product images:', productImages.length);
    productImages.forEach(link => {
        link.addEventListener('click', async function(e) {
            console.log('Product image clicked!');
            e.preventDefault();
            const productId = this.getAttribute('data-product-id');
            console.log('Product ID:', productId);
            console.log('All products:', window.allProducts);
            const agent = localStorage.getItem('agent') || 'kakobuy';
            // Najdi produkt podle id - zkus různé možnosti
            const product = window.allProducts.find(p => 
                p._id === productId || 
                p.id === productId || 
                p._id === parseInt(productId) || 
                p.id === parseInt(productId)
            );
            console.log('Found product:', product);
            if (!product || !product.link) {
                console.log('No product or link found');
                return;
            }

            // Zavolej API pro konverzi odkazu
            try {
                const apiUrl = `https://affiliate.repsheet.net/convert?link=${encodeURIComponent(product.link)}`;
                console.log('Calling API:', apiUrl);
                const response = await fetch(apiUrl);
                const data = await response.json();
                let affiliateLink = data[agent] || data.kakobuy || product.link;
                console.log('Opening affiliate link:', affiliateLink);
                window.open(affiliateLink, '_blank', 'noopener,noreferrer');
            } catch (err) {
                console.log('Error:', err);
                // Fallback: otevři rawlink
                window.open(product.link, '_blank', 'noopener,noreferrer');
            }
        });
    });
    
    // Add click event listeners to report link buttons
    document.querySelectorAll('.report-dead-link').forEach(button => {
        const productId = button.getAttribute('data-product-id');
        
        // Check if this item was already reported and disable button if it was
        if (isItemAlreadyReported(productId)) {
            button.disabled = true;
            button.classList.add('already-reported');
            button.setAttribute('title', 'Already reported');
        }
        
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // If button is disabled or already reported, don't proceed
            if (this.disabled || this.classList.contains('already-reported')) {
                return;
            }
            
            const productId = this.getAttribute('data-product-id');
            const productName = this.getAttribute('data-product-name');
            const productLink = this.getAttribute('data-product-link');
            
            // Mark this item as reported
            markItemAsReported(productId);
            
            // Disable the button to prevent multiple reports
            this.disabled = true;
            this.classList.add('already-reported');
            this.setAttribute('title', 'Report sent');
            
            // Send report directly to Discord webhook without confirmation dialog
            sendDeadLinkReport(productId, productName, productLink);
        });
    });
    
    // If no products are left to load, don't add scroll event listener
    if (currentDisplayCount >= currentProductsToDisplay.length) {
        window.removeEventListener('scroll', handleLazyLoad);
    } else {
        window.addEventListener('scroll', handleLazyLoad);
    }
}

// Function to create affiliate link manually
function createAffiliateLink(product, agent) {
    if (product.link.includes('taobao.com')) {
        const itemId = product.link.match(/id=(\d+)/)?.[1];
        if (itemId) {
            return `https://affiliate.repsheet.net/${agent}/taobao/${itemId}`;
        }
    }
    return product.link; // fallback to original link
}

// Enhanced adblock detection with multiple methods
function detectAdblock() {
    return new Promise((resolve) => {
        console.log('🔍 Starting adblock detection...');
        
        // Method 1: Test ad element with common adblock class names
        const testElements = [
            { className: 'adsbox', id: 'adsbox-test' },
            { className: 'advertisement', id: 'advertisement-test' },
            { className: 'adsbygoogle', id: 'adsbygoogle-test' },
            { className: 'ad-container', id: 'ad-container-test' },
            { className: 'google-ad', id: 'google-ad-test' },
            { className: 'banner-ad', id: 'banner-ad-test' }
        ];
        
        let blockedCount = 0;
        const testElementsArray = [];
        
        testElements.forEach((test, index) => {
            const testElement = document.createElement('div');
            testElement.innerHTML = '&nbsp;';
            testElement.className = test.className;
            testElement.id = test.id;
            testElement.style.position = 'absolute';
            testElement.style.left = '-10000px';
            testElement.style.top = '-1000px';
            testElement.style.width = '1px';
            testElement.style.height = '1px';
            testElement.style.overflow = 'hidden';
            testElement.style.zIndex = '-9999';
            document.body.appendChild(testElement);
            testElementsArray.push(testElement);
            
            console.log(`Testing element ${test.className}:`, testElement.offsetHeight);
        });
        
        // Method 2: Test if common ad scripts are blocked
        const adScripts = [
            'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
            'https://www.googletagmanager.com/gtag/js',
            'https://www.google-analytics.com/analytics.js'
        ];
        
        let scriptBlocked = false;
        let scriptTestsCompleted = 0;
        adScripts.forEach(scriptUrl => {
            const script = document.createElement('script');
            script.src = scriptUrl;
            script.onerror = () => {
                console.log(`Script blocked: ${scriptUrl}`);
                scriptBlocked = true;
                scriptTestsCompleted++;
            };
            script.onload = () => {
                console.log(`Script loaded: ${scriptUrl}`);
                scriptTestsCompleted++;
            };
            document.head.appendChild(script);
        });
        
        // Method 2.5: Test ad images
        const adImages = [
            'https://pagead2.googlesyndication.com/pagead/imgad?id=CICAgKCNjM-mARABGAEyCJjF0-t6',
            'https://www.google-analytics.com/collect',
            'https://www.googletagmanager.com/gtm.js'
        ];
        
        let imageBlocked = false;
        let imageTestsCompleted = 0;
        adImages.forEach(imageUrl => {
            const img = new Image();
            img.onerror = () => {
                console.log(`Ad image blocked: ${imageUrl}`);
                imageBlocked = true;
                imageTestsCompleted++;
            };
            img.onload = () => {
                console.log(`Ad image loaded: ${imageUrl}`);
                imageTestsCompleted++;
            };
            img.src = imageUrl;
        });
        
        // Method 3: Test common ad selectors
        const adSelectors = [
            '.adsbygoogle',
            '.advertisement',
            '.ad-container',
            '[class*="ad-"]',
            '[id*="ad-"]',
            '[class*="ads-"]',
            '[id*="ads-"]',
            '[class*="banner"]',
            '[id*="banner"]'
        ];
        
        let blockedElements = 0;
        adSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (el.offsetHeight === 0 || el.style.display === 'none') {
                    blockedElements++;
                }
            });
        });
        
        // Method 4: Test fetch requests to ad domains
        const adDomains = [
            'https://pagead2.googlesyndication.com',
            'https://www.google-analytics.com',
            'https://www.googletagmanager.com'
        ];
        
        let fetchBlocked = false;
        let fetchTestsCompleted = 0;
        
        adDomains.forEach(domain => {
            fetch(domain, { method: 'HEAD', mode: 'no-cors' })
                .then(() => {
                    console.log(`Fetch to ${domain} succeeded`);
                    fetchTestsCompleted++;
                })
                .catch(() => {
                    console.log(`Fetch to ${domain} blocked`);
                    fetchBlocked = true;
                    fetchTestsCompleted++;
                });
        });
        
        // Check completion and resolve
        const checkCompletion = () => {
            const allTestsCompleted = 
                scriptTestsCompleted >= adScripts.length && 
                imageTestsCompleted >= adImages.length && 
                fetchTestsCompleted >= adDomains.length;
            
            if (allTestsCompleted) {
                // Check which elements are blocked
                testElementsArray.forEach((element, index) => {
                    const isBlocked = element.offsetHeight === 0;
                    console.log(`Element ${testElements[index].className} blocked:`, isBlocked);
                    if (isBlocked) blockedCount++;
                });
                
                // Clean up test elements
                testElementsArray.forEach(element => {
                    if (element.parentNode) {
                        element.parentNode.removeChild(element);
                    }
                });
                
                const isBlocked = blockedCount > 0 || scriptBlocked || imageBlocked || fetchBlocked || blockedElements > 0;
                console.log('🔍 Adblock detection results:');
                console.log('- Blocked test elements:', blockedCount);
                console.log('- Blocked scripts:', scriptBlocked);
                console.log('- Blocked images:', imageBlocked);
                console.log('- Blocked fetch requests:', fetchBlocked);
                console.log('- Blocked existing elements:', blockedElements);
                console.log('- Final result (adblock detected):', isBlocked);
                
                resolve(isBlocked);
            } else {
                // Check again in 100ms
                setTimeout(checkCompletion, 100);
            }
        };
        
        // Start checking for completion after a short delay
        setTimeout(checkCompletion, 100);
    });
}

// Initialize adblock detection with delay to avoid false positives
function initializeAdblockDetection() {
    console.log('🚀 Initializing adblock detection...');
    
    // Wait for page to fully load before detecting adblock
    setTimeout(async () => {
        try {
            console.log('🔍 Running adblock detection...');
            const isAdblockActive = await detectAdblock();
            
            console.log('📊 Adblock detection result:', isAdblockActive);
            
            if (isAdblockActive) {
                console.log('⚠️ Adblock detected! Checking if warning should be shown...');
                
                // Check if user has already dismissed the warning
                const dismissed = localStorage.getItem('adblockWarningDismissed');
                const dismissedTime = localStorage.getItem('adblockWarningDismissedTime');
                const now = Date.now();
                
                console.log('Dismissed:', dismissed);
                console.log('Dismissed time:', dismissedTime);
                
                // Always show warning if adblock is detected (removed 24h restriction)
                console.log('🎯 Showing adblock warning...');
                showAdblockWarning();
            } else {
                console.log('✅ No adblock detected');
            }
        } catch (error) {
            console.error('❌ Adblock detection error:', error);
        }
    }, 1000); // Reduced to 1 second for faster detection
    
    // Add manual trigger for testing
    window.testAdblock = async () => {
        console.log('🧪 Manual adblock test triggered');
        const result = await detectAdblock();
        console.log('🧪 Manual test result:', result);
        if (result) {
            showAdblockWarning();
        }
        return result;
    };
}

// Modern adblock warning with improved design
function showAdblockWarning() {
    // Remove existing warning if any
    const existingWarning = document.getElementById('adblock-warning');
    if (existingWarning) {
        existingWarning.remove();
    }
    
    const warning = document.createElement('div');
    warning.id = 'adblock-warning';
    warning.innerHTML = `
        <div class="adblock-overlay">
            <div class="adblock-content">
                <div class="adblock-header">
                    <div class="adblock-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                            <line x1="12" y1="9" x2="12" y2="13"></line>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                    </div>
                    <button class="adblock-close" onclick="hideAdblockWarning()">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 6 6 18"></path>
                            <path d="m6 6 12 12"></path>
                        </svg>
                    </button>
                </div>
                <div class="adblock-body">
                    <h2>Ad Blocker Detected</h2>
                    <p>We detected that you're using an ad blocker. This website uses affiliate links to provide you with the best shopping experience.</p>
                    <div class="adblock-features">
                        <div class="feature-item">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M9 12l2 2 4-4"></path>
                                <path d="M21 12c-1 0-2.4-.4-3.5-1.5S16 9 16 8s.4-2.5 1.5-3.5S20 3 21 3s2.4.4 3.5 1.5S26 7 26 8s-.4 2.5-1.5 3.5S22 12 21 12z"></path>
                            </svg>
                            <span>Best prices and deals</span>
                        </div>
                        <div class="feature-item">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M9 12l2 2 4-4"></path>
                                <path d="M21 12c-1 0-2.4-.4-3.5-1.5S16 9 16 8s.4-2.5 1.5-3.5S20 3 21 3s2.4.4 3.5 1.5S26 7 26 8s-.4 2.5-1.5 3.5S22 12 21 12z"></path>
                            </svg>
                            <span>Secure affiliate links</span>
                        </div>
                        <div class="feature-item">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M9 12l2 2 4-4"></path>
                                <path d="M21 12c-1 0-2.4-.4-3.5-1.5S16 9 16 8s.4-2.5 1.5-3.5S20 3 21 3s2.4.4 3.5 1.5S26 7 26 8s-.4 2.5-1.5 3.5S22 12 21 12z"></path>
                            </svg>
                            <span>No tracking or ads</span>
                        </div>
                    </div>
                    <p class="adblock-note"><strong>Please disable your ad blocker to use all features properly.</strong></p>
                </div>
                <div class="adblock-actions">
                    <button onclick="window.showAdblockConfirmation()" class="adblock-btn secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 6 6 18"></path>
                            <path d="m6 6 12 12"></path>
                        </svg>
                        Continue Anyway
                    </button>
                    <button onclick="location.reload()" class="adblock-btn primary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                            <path d="M21 3v5h-5"></path>
                            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                            <path d="M3 21v-5h5"></path>
                        </svg>
                        Reload Page
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(warning);
    
    // Add modern styles
    const style = document.createElement('style');
    style.textContent = `
        #adblock-warning {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.85) 100%);
            backdrop-filter: blur(12px);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Inter', sans-serif;
            animation: fadeIn 0.3s ease-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .adblock-overlay {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            border-radius: 24px;
            padding: 0;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 32px 64px rgba(0, 0, 0, 0.4);
            animation: slideIn 0.4s ease-out;
            border: 1px solid rgba(255, 255, 255, 0.1);
            position: relative;
            overflow: hidden;
        }
        
        .adblock-overlay::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%);
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-30px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        
        .adblock-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 28px 28px 0 28px;
        }
        
        .adblock-icon {
            color: #f59e0b;
            background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%);
            border-radius: 16px;
            padding: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(245, 158, 11, 0.3);
        }
        
        .adblock-close {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            color: rgba(255, 255, 255, 0.7);
        }
        
        .adblock-close:hover {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            transform: scale(1.05);
        }
        
        .adblock-body {
            padding: 24px 28px 28px 28px;
        }
        
        .adblock-body h2 {
            color: white;
            margin: 0 0 16px 0;
            font-size: 24px;
            font-weight: 700;
            line-height: 1.3;
            text-align: center;
        }
        
        .adblock-body p {
            color: rgba(255, 255, 255, 0.8);
            margin: 0 0 24px 0;
            line-height: 1.6;
            font-size: 16px;
            text-align: center;
        }
        
        .adblock-features {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            padding: 20px;
            margin: 24px 0;
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(8px);
        }
        
        .feature-item {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
            color: rgba(255, 255, 255, 0.9);
            font-size: 15px;
        }
        
        .feature-item:last-child {
            margin-bottom: 0;
        }
        
        .feature-item svg {
            color: #10b981;
            flex-shrink: 0;
            background: rgba(16, 185, 129, 0.2);
            border-radius: 8px;
            padding: 4px;
        }
        
        .adblock-note {
            background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%);
            border-radius: 12px;
            padding: 16px;
            margin: 20px 0 0 0 !important;
            border-left: 4px solid #f59e0b;
            color: rgba(255, 255, 255, 0.9);
        }
        
        .adblock-actions {
            display: flex;
            gap: 16px;
            justify-content: center;
            padding: 0 28px 28px 28px;
        }
        
        .adblock-btn {
            padding: 14px 24px;
            border-radius: 12px;
            border: none;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 160px;
            justify-content: center;
            position: relative;
            overflow: hidden;
        }
        
        .adblock-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
            transition: left 0.5s;
        }
        
        .adblock-btn:hover::before {
            left: 100%;
        }
        
        .adblock-btn.primary {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
            border: 1px solid rgba(59, 130, 246, 0.3);
        }
        
        .adblock-btn.primary:hover {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            transform: translateY(-2px);
            box-shadow: 0 12px 32px rgba(59, 130, 246, 0.5);
        }
        
        .adblock-btn.secondary {
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(8px);
        }
        
        .adblock-btn.secondary:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
            color: white;
        }
        
        @media (max-width: 480px) {
            .adblock-overlay {
                width: 95%;
                margin: 20px;
            }
            
            .adblock-actions {
                flex-direction: column;
            }
            
            .adblock-btn {
                width: 100%;
            }
        }
        
        /* Confirmation dialog specific styles */
        .confirmation-content {
            max-width: 520px;
        }
        
        .confirmation-content .adblock-icon {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%);
            border: 1px solid rgba(59, 130, 246, 0.3);
            color: #3b82f6;
        }
        
        .confirmation-content .adblock-body h2 {
            color: #3b82f6;
        }
        
        .confirmation-content .adblock-note {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%);
            border-left: 4px solid #3b82f6;
        }
        
        /* Specific styles for adblock confirmation dialog */
        #adblock-confirmation {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.85) 100%);
            backdrop-filter: blur(12px);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Inter', sans-serif;
            animation: fadeIn 0.3s ease-out;
        }
        
        #adblock-confirmation .adblock-overlay {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            border-radius: 24px;
            padding: 0;
            max-width: 520px;
            width: 90%;
            box-shadow: 0 32px 64px rgba(0, 0, 0, 0.4);
            animation: slideIn 0.4s ease-out;
            border: 1px solid rgba(255, 255, 255, 0.1);
            position: relative;
            overflow: hidden;
        }
        
        #adblock-confirmation .adblock-overlay::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%);
        }
    `;
    document.head.appendChild(style);
}

// Function to show confirmation dialog
function showAdblockConfirmation() {
    // Remove existing warning
    const warning = document.getElementById('adblock-warning');
    if (warning) {
        warning.remove();
    }
    
    const confirmation = document.createElement('div');
    confirmation.id = 'adblock-confirmation';
    confirmation.innerHTML = `
        <div class="adblock-overlay">
            <div class="adblock-content confirmation-content">
                <div class="adblock-header">
                    <div class="adblock-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M12 16v-4"></path>
                            <path d="M12 8h.01"></path>
                        </svg>
                    </div>
                    <button class="adblock-close" onclick="window.hideAdblockConfirmation()">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 6 6 18"></path>
                            <path d="m6 6 12 12"></path>
                        </svg>
                    </button>
                </div>
                <div class="adblock-body">
                    <h2>Are you sure?</h2>
                    <p>We have <strong>0 ads</strong> on this website, but we need the API to run as it should. Please turn off your ad blocker for the best experience.</p>
                    <div class="adblock-features">
                        <div class="feature-item">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M9 12l2 2 4-4"></path>
                                <path d="M21 12c-1 0-2.4-.4-3.5-1.5S16 9 16 8s.4-2.5 1.5-3.5S20 3 21 3s2.4.4 3.5 1.5S26 7 26 8s-.4 2.5-1.5 3.5S22 12 21 12z"></path>
                            </svg>
                            <span>No annoying popups or banners</span>
                        </div>
                        <div class="feature-item">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M9 12l2 2 4-4"></path>
                                <path d="M21 12c-1 0-2.4-.4-3.5-1.5S16 9 16 8s.4-2.5 1.5-3.5S20 3 21 3s2.4.4 3.5 1.5S26 7 26 8s-.4 2.5-1.5 3.5S22 12 21 12z"></path>
                            </svg>
                            <span>Clean, ad-free experience</span>
                        </div>
                        <div class="feature-item">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M9 12l2 2 4-4"></path>
                                <path d="M21 12c-1 0-2.4-.4-3.5-1.5S16 9 16 8s.4-2.5 1.5-3.5S20 3 21 3s2.4.4 3.5 1.5S26 7 26 8s-.4 2.5-1.5 3.5S22 12 21 12z"></path>
                            </svg>
                            <span>API needs to function properly</span>
                        </div>
                    </div>
                    <p class="adblock-note"><strong>Please disable your ad blocker to use all features properly.</strong></p>
                </div>
                <div class="adblock-actions">
                    <button onclick="window.hideAdblockConfirmation()" class="adblock-btn secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 6 6 18"></path>
                            <path d="m6 6 12 12"></path>
                        </svg>
                        I'll keep it on
                    </button>
                    <button onclick="location.reload()" class="adblock-btn primary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                            <path d="M21 3v5h-5"></path>
                            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                            <path d="M3 21v-5h5"></path>
                        </svg>
                        Turn off ad blocker
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(confirmation);
    
    // Add styles for confirmation dialog
    const confirmationStyle = document.createElement('style');
    confirmationStyle.textContent = `
        #adblock-confirmation {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.85) 100%);
            backdrop-filter: blur(12px);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Inter', sans-serif;
            animation: fadeIn 0.3s ease-out;
        }
        
        #adblock-confirmation .adblock-overlay {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            border-radius: 24px;
            padding: 0;
            max-width: 520px;
            width: 90%;
            box-shadow: 0 32px 64px rgba(0, 0, 0, 0.4);
            animation: slideIn 0.4s ease-out;
            border: 1px solid rgba(255, 255, 255, 0.1);
            position: relative;
            overflow: hidden;
        }
        
        #adblock-confirmation .adblock-overlay::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%);
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-30px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        
        #adblock-confirmation .adblock-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 28px 28px 0 28px;
        }
        
        #adblock-confirmation .adblock-icon {
            color: #3b82f6;
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%);
            border-radius: 16px;
            padding: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(59, 130, 246, 0.3);
        }
        
        #adblock-confirmation .adblock-close {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            color: rgba(255, 255, 255, 0.7);
        }
        
        #adblock-confirmation .adblock-close:hover {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            transform: scale(1.05);
        }
        
        #adblock-confirmation .adblock-body {
            padding: 24px 28px 28px 28px;
        }
        
        #adblock-confirmation .adblock-body h2 {
            color: #3b82f6;
            margin: 0 0 16px 0;
            font-size: 24px;
            font-weight: 700;
            line-height: 1.3;
            text-align: center;
        }
        
        #adblock-confirmation .adblock-body p {
            color: rgba(255, 255, 255, 0.8);
            margin: 0 0 24px 0;
            line-height: 1.6;
            font-size: 16px;
            text-align: center;
        }
        
        #adblock-confirmation .adblock-features {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            padding: 20px;
            margin: 24px 0;
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(8px);
        }
        
        #adblock-confirmation .feature-item {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
            color: rgba(255, 255, 255, 0.9);
            font-size: 15px;
        }
        
        #adblock-confirmation .feature-item:last-child {
            margin-bottom: 0;
        }
        
        #adblock-confirmation .feature-item svg {
            color: #10b981;
            flex-shrink: 0;
            background: rgba(16, 185, 129, 0.2);
            border-radius: 8px;
            padding: 4px;
        }
        
        #adblock-confirmation .adblock-note {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%);
            border-radius: 12px;
            padding: 16px;
            margin: 20px 0 0 0 !important;
            border-left: 4px solid #3b82f6;
            color: rgba(255, 255, 255, 0.9);
        }
        
        #adblock-confirmation .adblock-actions {
            display: flex;
            gap: 16px;
            justify-content: center;
            padding: 0 28px 28px 28px;
        }
        
        #adblock-confirmation .adblock-btn {
            padding: 14px 24px;
            border-radius: 12px;
            border: none;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 160px;
            justify-content: center;
            position: relative;
            overflow: hidden;
        }
        
        #adblock-confirmation .adblock-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
            transition: left 0.5s;
        }
        
        #adblock-confirmation .adblock-btn:hover::before {
            left: 100%;
        }
        
        #adblock-confirmation .adblock-btn.primary {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
            border: 1px solid rgba(59, 130, 246, 0.3);
        }
        
        #adblock-confirmation .adblock-btn.primary:hover {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            transform: translateY(-2px);
            box-shadow: 0 12px 32px rgba(59, 130, 246, 0.5);
        }
        
        #adblock-confirmation .adblock-btn.secondary {
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(8px);
        }
        
        #adblock-confirmation .adblock-btn.secondary:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
            color: white;
        }
        
        @media (max-width: 480px) {
            #adblock-confirmation .adblock-overlay {
                width: 95%;
                margin: 20px;
            }
            
            #adblock-confirmation .adblock-actions {
                flex-direction: column;
            }
            
            #adblock-confirmation .adblock-btn {
                width: 100%;
            }
        }
    `;
    document.head.appendChild(confirmationStyle);
}

// Function to hide adblock confirmation
function hideAdblockConfirmation() {
    const confirmation = document.getElementById('adblock-confirmation');
    if (confirmation) {
        // Add fade out animation
        confirmation.style.opacity = '0';
        confirmation.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            if (confirmation.parentNode) {
                confirmation.remove();
            }
        }, 300);
        
        // Save that user dismissed the warning
        localStorage.setItem('adblockWarningDismissed', 'true');
        localStorage.setItem('adblockWarningDismissedTime', Date.now().toString());
    }
}

// Function to hide adblock warning
function hideAdblockWarning() {
    const warning = document.getElementById('adblock-warning');
    if (warning) {
        // Add fade out animation
        warning.style.opacity = '0';
        warning.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            if (warning.parentNode) {
                warning.remove();
            }
        }, 300);
        
        // Save that user dismissed the warning
        localStorage.setItem('adblockWarningDismissed', 'true');
        localStorage.setItem('adblockWarningDismissedTime', Date.now().toString());
    }
}

// Function to handle loading more items on scroll
function handleLazyLoad() {
    // Check if we're near the bottom of the page
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
        // Remove scroll listener to prevent multiple triggers
        window.removeEventListener('scroll', handleLazyLoad);
        
        // Show loading spinner
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = '<div class="loading-spinner"></div>';
        document.querySelector('.products-grid').appendChild(loadingIndicator);
        
        // Load more products after a small delay to allow spinner to render
        setTimeout(() => {
            // Remove loading indicator
            document.querySelector('.loading-indicator').remove();
            
            // Load more products
            if (currentDisplayCount < currentProductsToDisplay.length) {
                displayProducts(currentProductsToDisplay);
            }
        }, 500);
    }
}

// Function to send dead link report directly to Discord webhook
function sendDeadLinkReport(productId, productName, productLink) {
    // Check for rate limits
    if (isRateLimited()) {
        showToast('Rate Limited', 'Please wait before submitting another report.', 'error');
        return;
    }
    
    // IMPORTANT: Replace this placeholder URL with your actual Discord webhook URL
    // Create a webhook URL in your Discord server settings -> Integrations -> Webhooks
    const webhookUrl = 'https://discord.com/api/webhooks/1170382133882277974/XNf61Fzqqdnb22e_kICb0mAMpYIFUJ7IpCVX8uA2n5rk_vpQeNp1qh3OWFbuS0n72llw';
    
    // Get current date and time for the report
    const now = new Date();
    const formattedDateTime = now.toLocaleString();
    
    // Update rate limit counter
    updateRateLimit();
    
    // Create webhook payload with product details
    const payload = {
        embeds: [{
            title: '🚨 Dead Link Report',
            description: 'A user has reported a dead product link',
            color: 16711680, // Red color in decimal
            fields: [
                {
                    name: 'Product Name',
                    value: productName || 'Unknown',
                    inline: false
                },
                {
                    name: 'Product ID',
                    value: productId || 'Unknown',
                    inline: true
                },
                {
                    name: 'Reported Link',
                    value: productLink || 'No link provided',
                    inline: false
                },
                {
                    name: 'User Agent',
                    value: navigator.userAgent || 'Unknown',
                    inline: false
                }
            ],
            footer: {
                text: `Reported at ${formattedDateTime}`
            }
        }]
    };
    
    // Send the webhook request
    fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (response.ok) {
            // Show success message to the user
            showToast('Thank you', 'Link reported as dead. We will check it soon.', 'report');
        } else {
            // Handle error but still show success to avoid confusion
            console.error('Error sending dead link report:', response.status);
            showToast('Thank you', 'Link reported as dead. We will check it soon.', 'report');
        }
    })
    .catch(error => {
        // Log the error but still show success toast to user
        console.error('Error sending dead link report:', error);
        showToast('Thank you', 'Link reported as dead. We will check it soon.', 'report');
    });
    
    // Mark the button as reported across all instances
    document.querySelectorAll(`.report-dead-link[data-product-id="${productId}"]`).forEach(btn => {
        btn.disabled = true;
        btn.classList.add('already-reported');
        btn.setAttribute('title', 'Already reported');
    });
}

// Add CSS for report button styling (without modal dialog styles)
function addReportButtonStyles() {
    if (!document.getElementById('report-styles')) {
        const style = document.createElement('style');
        style.id = 'report-styles';
        style.textContent = `
            /* Product container for positioning */
            .product-container {
                position: relative;
                width: 100%;
                overflow: hidden;
                border-radius: 8px 8px 0 0;
            }
            
            /* Report button styling */
            .report-dead-link {
                position: absolute;
                top: 8px;
                right: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background-color: rgba(30, 30, 30, 0.7);
                border: none;
                cursor: pointer;
                z-index: 2;
                transition: all 0.2s ease;
                padding: 0;
                color: rgba(255, 255, 255, 0.6);
            }
            
            .report-dead-link:hover {
                background-color: rgba(255, 50, 50, 0.9);
                color: white;
            }
        `;
        document.head.appendChild(style);
    }
}

function generateRandomToast() {
    const toastData = [
        { 
            type: 'discord',
            title: 'Discord', 
            description: 'Are you on my Discord server?<br>Join my Discord server <a href="https://xx.xx" target="_blank" rel="noopener noreferrer">here</a>'
        },
        { 
            type: 'registration',
            title: 'KakoBuy', 
            description: 'Are you registered on KakoBuy?<br>Register through this <a href="https://xx.xx" target="_blank" rel="noopener noreferrer">LINK</a> and get coupons worth $410!'
        },
        { 
            type: 'tutorial',
            title: 'Tutorial', 
            description: 'Find a tutorial on how to order from KakoBuy <a href="https://www.youtube.com/@Dex_hauls" target="_blank" rel="noopener noreferrer">HERE</a>'
        },
        { 
            type: 'youtube',
            title: 'YouTube', 
            description: 'Don\'t forget to subscribe to my YouTube channel <a href="https://www.youtube.com/@Dex_hauls" target="_blank" rel="noopener noreferrer">@Dex_hauls</a>'
        }
    ];
    
    // Select one random toast
    const randomIndex = Math.floor(Math.random() * toastData.length);
    const toast = toastData[randomIndex];
    
    // Display the toast notification
    showToast(toast.title, toast.description, toast.type);
}

function showToast(title, description, type) {
    const toastContainer = document.querySelector('.toast-container');
    
    // Create toast element
    const toast = document.createElement('li');
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'off');
    toast.setAttribute('aria-atomic', 'true');
    toast.setAttribute('tabindex', '0');
    toast.setAttribute('data-state', 'open');
    toast.className = 'toast';
    
    toast.innerHTML = `
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-description">${description}</div>
        </div>
        <button type="button" class="toast-close">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x h-4 w-4">
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
            </svg>
        </button>
    `;
    
    // Add to the container
    toastContainer.appendChild(toast);
    
    // Add event listener to close button
    const closeButton = toast.querySelector('.toast-close');
    closeButton.addEventListener('click', () => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.remove();
        }, 300);
    });
    
    // Auto-fade out after 30 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }
    }, 30000);
    
    // Add link click handling if there are links in the toast
    const links = toast.querySelectorAll('a');
    links.forEach(link => {
        link.style.color = '#ffffff';
        link.style.textDecoration = 'underline';
        link.style.fontWeight = 'bold';
    });
}

// Handle sidebar menu toggle
document.addEventListener('click', (event) => {
    if (event.target.closest('.menu-item') || event.target.closest('.plus')) {
        const menuItem = event.target.closest('.menu-item') || event.target.closest('.plus').parentElement;
        const plus = menuItem.querySelector('.plus');
        
        if (plus.textContent === '+') {
            plus.textContent = '-';
            // Here you would toggle a submenu if needed
        } else {
            plus.textContent = '+';
            // Here you would hide the submenu if needed
        }
    }
});

// Initialize back-to-top button functionality
function initBackToTopButton() {
    const backToTopButton = document.querySelector('.back-to-top');
    if (!backToTopButton) return;
    
    // Show button when scrolling down
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopButton.classList.add('visible');
        } else {
            backToTopButton.classList.remove('visible');
        }
    });
    
    // Scroll to top when clicked
    backToTopButton.addEventListener('click', () => {
        // Smooth scroll to top
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Function to style the Pages and Socials sections in the sidebar
function styleSidebarSections() {
    // Define icons for Pages section
    const pageIcons = {
        'Tutorial': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>`,
        'FAQ': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <path d="M12 17h.01"></path>
                    </svg>`,
        'Tracking': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 13V2l8 4-8 4"></path>
                        <path d="M20.55 10.23A9 9 0 1 1 8 4.94"></path>
                        <path d="M8 10a5 5 0 1 0 8.9 2.02"></path>
                    </svg>`,
        'Sellers': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>`
    };

    // Process each sidebar section
    const sidebarHeadings = document.querySelectorAll('.sidebar-heading');
    sidebarHeadings.forEach(heading => {
        const sectionTitle = heading.textContent.trim();
        
        // Handle Pages section
        if (sectionTitle === 'Pages') {
            let currentElement = heading.nextElementSibling;
            
            // Apply styles to the heading to fix spacing
            heading.style.marginBottom = '4px';
            
            while (currentElement && 
                   !currentElement.classList.contains('sidebar-heading') && 
                   !currentElement.classList.contains('divider')) {
                
                if (currentElement.classList.contains('nav-item')) {
                    // Apply direct styling to fix margins
                    currentElement.style.marginTop = '0';
                    currentElement.style.marginBottom = '2px';
                    
                    const link = currentElement.querySelector('a');
                    if (link) {
                        const pageName = link.textContent.trim();
                        const icon = pageIcons[pageName] || '';
                        
                        // Add target="_blank" for all pages except FAQ, Tracking, and Sellers
                        const shouldOpenInNewTab = !['FAQ', 'Tracking', 'Sellers'].includes(pageName);
                        const targetAttr = shouldOpenInNewTab ? ' target="_blank"' : '';
                        
                        // Store original href
                        const href = link.getAttribute('href');
                        
                        // Add the icon HTML
                        link.className = 'page-link';
                        link.innerHTML = `
                            <span class="page-icon">${icon}</span>
                            <span class="page-name">${pageName}</span>
                        `;
                        
                        // Make sure we restore the href and add target attribute if needed
                        link.setAttribute('href', href);
                        if (shouldOpenInNewTab) {
                            link.setAttribute('target', '_blank');
                            link.setAttribute('rel', 'noopener noreferrer');
                        }
                    }
                }
                
                currentElement = currentElement.nextElementSibling;
            }
        }
        
        // Handle Socials section
        if (sectionTitle === 'Socials') {
            let currentElement = heading.nextElementSibling;
            
            // Apply styles to the heading to fix spacing
            heading.style.marginBottom = '4px';
            
            while (currentElement && 
                   !currentElement.classList.contains('sidebar-heading') && 
                   !currentElement.classList.contains('divider')) {
                
                // Fix margin for all social items
                if (currentElement.classList.contains('social-item') || currentElement.classList.contains('nav-item')) {
                    // Apply direct styling to fix margins
                    currentElement.style.marginTop = '0';
                    currentElement.style.marginBottom = '2px';
                    
                    const link = currentElement.querySelector('.social-link');
                    if (link) {
                        // Make all social links open in a new tab
                        link.setAttribute('target', '_blank');
                        link.setAttribute('rel', 'noopener noreferrer');
                        
                        // Keep the original image but restructure the layout
                        const oldContent = link.innerHTML;
                        const platformName = link.textContent.trim();
                        
                        // Extract image element if it exists
                        const iconImg = link.querySelector('img.social-icon');
                        const iconWrapper = link.querySelector('.icon-wrapper');
                        
                        if (iconWrapper && iconImg) {
                            // Store original href
                            const href = link.getAttribute('href');
                            
                            // Keep the existing icon but apply new styling
                            iconWrapper.className = 'social-icon-wrapper';
                            
                            // Set consistent sizing on the image
                            iconImg.style.width = '14px';
                            iconImg.style.height = '14px';
                            
                            // Create structured HTML with left-aligned icon
                            link.innerHTML = `
                                <div class="sidebar-item-left">
                                    <span class="social-icon-wrapper">
                                        <img src="${iconImg.src}" alt="${iconImg.alt}" class="social-icon" width="14" height="14"/>
                                    </span>
                                    <span class="sidebar-item-name">${platformName}</span>
                                </div>
                            `;
                            
                            // Make sure we restore the href
                            link.setAttribute('href', href);
                        }
                    }
                }
                
                currentElement = currentElement.nextElementSibling;
            }
        }
    });
    
    // Add global CSS for the sidebar sections
    const style = document.createElement('style');
    style.textContent = `
        /* Shared styles for all sidebar items */
        .sidebar-heading {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            color: rgba(255, 255, 255, 0.5);
            margin: 12px 0 4px;
            padding: 0 15px;
        }
        
        /* Common styles for all sidebar links */
        .page-link, .social-link {
            display: flex !important;
            align-items: center;
            gap: 8px;
            padding: 5px 15px !important;
            border-radius: 6px;
            transition: all 0.15s ease;
            text-decoration: none;
            color: rgba(255, 255, 255, 0.9);
        }
        
        .page-link:hover, .social-link:hover {
            background-color: rgba(255, 255, 255, 0.1);
        }
        
        /* Icon containers */
        .page-icon, .social-icon-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(255, 255, 255, 0.7);
            width: 16px;
            height: 16px;
            min-width: 16px; /* Ensure consistent width */
        }
        
        .page-icon svg, .social-icon {
            width: 14px !important;
            height: 14px !important;
        }
        
        /* Text styling */
        .page-name, .sidebar-item-name {
            font-size: 13px;
            font-weight: 500;
        }
        
        /* Layout for left section (icon + text) */
        .sidebar-item-left {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        /* Make nav items have consistent styling */
        .nav-item {
            margin-bottom: 2px;
        }
        
        /* Fix for social items spacing */
        .social-item {
            margin-bottom: 2px;
            margin-top: 0 !important;
        }
        
        /* Make sure there's no extra margin before the first social item */
        .sidebar-heading + .social-item,
        .sidebar-heading + .nav-item {
            margin-top: 0 !important;
        }
        
        /* Fix spacing between sections */
        .divider {
            margin: 10px 0;
        }
        
        /* Remove any unwanted padding in sidebar list */
        .sidebar ul {
            padding-left: 0;
        }
        
        /* Make category items more compact */
        .category-item {
            margin-bottom: 2px !important;
        }
        
        .category-content {
            padding: 5px 12px !important;
        }
        
        .category-name, .category-icon {
            font-size: 13px !important;
        }
        
        .subcategory-list {
            padding: 2px 0 2px 32px !important;
            margin: 2px 0 0 0 !important;
        }
        
        .subcategory-item {
            padding: 3px 10px !important;
            margin-bottom: 1px !important;
            border-radius: 4px !important;
            cursor: pointer !important;
            display: flex !important;
            align-items: center !important;
            gap: 4px !important;
            width: 100% !important;
            box-sizing: border-box !important;
            font-size: 12px !important;
        }
        
        .subcategory-dot {
            color: rgba(255, 255, 255, 0.5) !important;
            display: inline-block !important;
            width: 10px !important;
            flex-shrink: 0 !important;
        }
        
        .subcategory-name {
            flex-grow: 1 !important;
        }
        
        .subcategory-item:hover {
            background-color: rgba(255, 255, 255, 0.1) !important;
        }
        
        .subcategory-item.active {
            background-color: rgba(255, 255, 255, 0.2) !important;
            font-weight: 500 !important;
        }
    `;
    document.head.appendChild(style);
}

// Function to check if an item was already reported
function isItemAlreadyReported(productId) {
    if (!productId) return false;
    
    // Get the reported items from localStorage
    const reportedItems = JSON.parse(localStorage.getItem('reportedItems') || '{}');
    
    // Check if this item is in the reported items list
    return !!reportedItems[productId];
}

// Function to mark an item as reported
function markItemAsReported(productId) {
    if (!productId) return;
    
    // Get the currently reported items
    const reportedItems = JSON.parse(localStorage.getItem('reportedItems') || '{}');
    
    // Add this item to the reported items with a timestamp
    reportedItems[productId] = Date.now();
    
    // Save back to localStorage
    localStorage.setItem('reportedItems', JSON.stringify(reportedItems));
    
    // Add visual feedback (toast notification)
    showToast('Report Sent', 'Thank you for your feedback. This link has been reported.');
}

// Rate limiting functions
function isRateLimited() {
    const rateLimitData = JSON.parse(localStorage.getItem('reportRateLimit') || '{}');
    const now = Date.now();
    
    // Check if there are recent reports (within last 5 minutes)
    if (rateLimitData.lastReport && (now - rateLimitData.lastReport < 5 * 60 * 1000)) {
        // Check if we've exceeded the max reports count (3 reports per 5 minutes)
        if (rateLimitData.count && rateLimitData.count >= 3) {
            return true;
        }
    } else {
        // If more than 5 minutes have passed, reset the count
        rateLimitData.count = 0;
    }
    
    return false;
}

function updateRateLimit() {
    const rateLimitData = JSON.parse(localStorage.getItem('reportRateLimit') || '{}');
    const now = Date.now();
    
    // If we're in a new 5-minute window, reset the count
    if (!rateLimitData.lastReport || (now - rateLimitData.lastReport > 5 * 60 * 1000)) {
        rateLimitData.count = 1;
    } else {
        // Increment the count if we're in the same window
        rateLimitData.count = (rateLimitData.count || 0) + 1;
    }
    
    rateLimitData.lastReport = now;
    
    // Save back to localStorage
    localStorage.setItem('reportRateLimit', JSON.stringify(rateLimitData));
}

// Make adblock functions globally available
window.showAdblockConfirmation = showAdblockConfirmation;
window.hideAdblockConfirmation = hideAdblockConfirmation;
window.hideAdblockWarning = hideAdblockWarning;
