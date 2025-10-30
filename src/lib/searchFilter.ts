/**
 * Employee Directory - Live Search Filter
 * Provides real-time filtering of employee cards based on search input
 */

export interface SearchableElement extends HTMLElement {
  dataset: {
    searchText?: string;
  };
}

/**
 * Initialize live search functionality on the employee directory
 * @param searchInputId - ID of the search input element
 * @param employeeCardsSelector - CSS selector for employee cards
 * @param onSearchCallback - Optional callback function when search is performed
 */
export function initializeLiveSearch(
  searchInputId: string,
  employeeCardsSelector: string,
  onSearchCallback?: (searchTerm: string, visibleCount: number) => void
): () => void {
  const searchInput = document.getElementById(searchInputId) as HTMLInputElement;

  if (!searchInput) {
    console.error(`Search input with id "${searchInputId}" not found`);
    return () => {};
  }

  let debounceTimer: NodeJS.Timeout;

  const handleSearch = () => {
    // Clear previous debounce timer
    clearTimeout(debounceTimer);

    // Debounce the search to avoid excessive filtering
    debounceTimer = setTimeout(() => {
      const searchTerm = searchInput.value.toLowerCase().trim();
      const employeeCards = document.querySelectorAll(employeeCardsSelector) as NodeListOf<SearchableElement>;
      let visibleCount = 0;

      employeeCards.forEach((card) => {
        // Get searchable text from data attribute or card content
        const searchableText = card.dataset.searchText || card.textContent || '';
        const normalizedText = searchableText.toLowerCase();

        // Check if card matches search term
        const isVisible = normalizedText.includes(searchTerm);

        // Show or hide the card with smooth transition
        if (isVisible) {
          card.style.display = 'flex';
          visibleCount++;

          // Add a slight delay for staggered animation effect
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'scale(1) translateY(0)';
          }, 10);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95) translateY(-10px)';

          // Hide after transition completes
          setTimeout(() => {
            card.style.display = 'none';
          }, 200);
        }
      });

      // Call the callback function if provided
      if (onSearchCallback) {
        onSearchCallback(searchTerm, visibleCount);
      }

      // Show empty state if no results
      updateEmptyState(visibleCount);
    }, 150); // 150ms debounce delay
  };

  // Add event listener
  searchInput.addEventListener('keyup', handleSearch);
  searchInput.addEventListener('input', handleSearch);

  // Return cleanup function
  return () => {
    clearTimeout(debounceTimer);
    searchInput.removeEventListener('keyup', handleSearch);
    searchInput.removeEventListener('input', handleSearch);
  };
}

/**
 * Update or show empty state message when no results found
 */
function updateEmptyState(visibleCount: number): void {
  const gridContainer = document.querySelector('.employee-grid');

  if (!gridContainer) return;

  // Remove existing empty state
  const existingEmptyState = gridContainer.querySelector('.empty-state');
  if (existingEmptyState) {
    existingEmptyState.remove();
  }

  // Add empty state if no visible cards
  if (visibleCount === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
      <svg class="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <h3 class="empty-state-title">No employees found</h3>
      <p class="empty-state-description">Try adjusting your search terms</p>
    `;
    gridContainer.appendChild(emptyState);
  }
}

/**
 * Clear search input and reset filters
 */
export function clearSearch(searchInputId: string): void {
  const searchInput = document.getElementById(searchInputId) as HTMLInputElement;

  if (searchInput) {
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

/**
 * Prepare employee cards with searchable text data attributes
 * This improves performance by pre-computing searchable text
 */
export function prepareEmployeeCards(employeeCardsSelector: string): void {
  const employeeCards = document.querySelectorAll(employeeCardsSelector) as NodeListOf<SearchableElement>;

  employeeCards.forEach((card) => {
    // Extract all text content from name, title, department, etc.
    const name = card.querySelector('.employee-name')?.textContent || '';
    const title = card.querySelector('.employee-title')?.textContent || '';
    const department = card.querySelector('.employee-department')?.textContent || '';
    const email = card.querySelector('.employee-email')?.textContent || '';
    const location = card.querySelector('.employee-location')?.textContent || '';

    // Combine all searchable text
    const searchText = [name, title, department, email, location]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    // Store in data attribute for faster searching
    card.dataset.searchText = searchText;

    // Ensure card has transition properties
    card.style.transition = 'opacity 0.2s ease-in-out, transform 0.2s ease-in-out';
  });
}

/**
 * Advanced multi-field search with highlighting
 */
export function highlightSearchTerm(searchTerm: string, employeeCardsSelector: string): void {
  if (!searchTerm) return;

  const employeeCards = document.querySelectorAll(employeeCardsSelector);

  employeeCards.forEach((card) => {
    const textElements = card.querySelectorAll('.employee-name, .employee-title, .employee-department');

    textElements.forEach((element) => {
      const originalText = element.getAttribute('data-original-text') || element.textContent || '';

      // Store original text if not already stored
      if (!element.getAttribute('data-original-text')) {
        element.setAttribute('data-original-text', originalText);
      }

      // Create highlighted version
      const regex = new RegExp(`(${searchTerm})`, 'gi');
      const highlightedText = originalText.replace(
        regex,
        '<mark style="background-color: var(--accent-color-light); padding: 2px 4px; border-radius: 3px;">$1</mark>'
      );

      element.innerHTML = highlightedText;
    });
  });
}

/**
 * Remove search highlighting
 */
export function removeHighlighting(employeeCardsSelector: string): void {
  const employeeCards = document.querySelectorAll(employeeCardsSelector);

  employeeCards.forEach((card) => {
    const textElements = card.querySelectorAll('.employee-name, .employee-title, .employee-department');

    textElements.forEach((element) => {
      const originalText = element.getAttribute('data-original-text');
      if (originalText) {
        element.textContent = originalText;
      }
    });
  });
}