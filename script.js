document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const landingPage = document.getElementById('landingPage');
    const editorScreen = document.getElementById('editorScreen');
    const startCreating = document.getElementById('startCreating');
    const startBtnNav = document.getElementById('startBtnNav');
    const backToLanding = document.getElementById('backToLanding');
    
    const invoiceItems = document.getElementById('invoiceItems');
    const addItemBtn = document.getElementById('addItemBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    
    // Navigation Logic
    const toggleView = (view) => {
        if (view === 'editor') {
            landingPage.classList.add('hidden');
            editorScreen.classList.remove('hidden');
            window.scrollTo(0, 0);
        } else {
            editorScreen.classList.add('hidden');
            landingPage.classList.remove('hidden');
            window.scrollTo(0, 0);
        }
    };

    startCreating.addEventListener('click', () => toggleView('editor'));
    startBtnNav.addEventListener('click', (e) => {
        e.preventDefault();
        toggleView('editor');
    });
    backToLanding.addEventListener('click', () => toggleView('landing'));

    // Initialize Dates
    const today = new Date();
    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };
    
    document.getElementById('currentDate').textContent = formatDate(today);
    
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 30);
    document.getElementById('dueDate').textContent = formatDate(dueDate);

    // Initial Row
    addItem();

    addItemBtn.addEventListener('click', () => addItem());

    function addItem() {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="v2-desc" data-label="Description">
                <div class="editable-field" contenteditable="true" data-placeholder="e.g. Logo Design Services"></div>
            </td>
            <td class="v2-qty" data-label="Qty">
                <div class="editable-field item-qty" contenteditable="true">1</div>
            </td>
            <td class="v2-rate" data-label="Price">
                <div class="editable-field item-rate" contenteditable="true">0.00</div>
            </td>
            <td class="v2-total" data-label="Amount">
                <span class="row-total">$0.00</span>
            </td>
            <td class="v2-action print-hidden" data-html2canvas-ignore="true">
                <button class="remove-item"><i data-lucide="x"></i></button>
            </td>
        `;
        
        invoiceItems.appendChild(row);
        lucide.createIcons();
        
        const qtyField = row.querySelector('.item-qty');
        const rateField = row.querySelector('.item-rate');
        
        [qtyField, rateField].forEach(field => {
            field.addEventListener('input', calculateInvoice);
        });

        row.querySelector('.remove-item').addEventListener('click', () => {
            if (document.querySelectorAll('#invoiceItems tr').length > 1) {
                row.remove();
                calculateInvoice();
            }
        });

        return row;
    }

    // Service Shortcuts Logic
    document.querySelectorAll('.service-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            const serviceName = tag.getAttribute('data-service');
            const servicePrice = tag.getAttribute('data-price');
            
            // Check if last row is empty, if so use it, otherwise add new
            const rows = document.querySelectorAll('#invoiceItems tr');
            const lastRow = rows[rows.length - 1];
            const lastDesc = lastRow.querySelector('.editable-field[data-placeholder]').textContent.trim();
            
            let rowToUse;
            if (lastDesc === "" || lastDesc === "e.g. Logo Design Services") {
                rowToUse = lastRow;
            } else {
                rowToUse = addItem();
            }
            
            rowToUse.querySelector('.editable-field[data-placeholder]').textContent = serviceName;
            rowToUse.querySelector('.item-rate').textContent = servicePrice;
            
            calculateInvoice();
            
            // Visual feedback
            tag.style.background = 'var(--p-accent)';
            tag.style.color = 'white';
            setTimeout(() => {
                tag.style.background = 'white';
                tag.style.color = 'var(--p-text)';
            }, 300);
        });
    });

    function calculateInvoice() {
        let subtotal = 0;
        const rows = document.querySelectorAll('#invoiceItems tr');
        
        rows.forEach(row => {
            const qtyText = row.querySelector('.item-qty').textContent.replace(/[^0-9.]/g, '');
            const rateText = row.querySelector('.item-rate').textContent.replace(/[^0-9.]/g, '');
            
            const qty = parseFloat(qtyText) || 0;
            const rate = parseFloat(rateText) || 0;
            const total = qty * rate;
            
            row.querySelector('.row-total').textContent = formatCurrency(total);
            subtotal += total;
        });

        const taxRate = 0; // Customizeable tax rate
        const tax = subtotal * taxRate;
        const grandTotal = subtotal + tax;

        document.getElementById('subtotalValue').textContent = formatCurrency(subtotal);
        document.getElementById('taxValue').textContent = formatCurrency(tax);
        document.getElementById('totalValue').textContent = formatCurrency(grandTotal);
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    }

    // PDF Export with High Quality & Single Page Guarantee
    downloadBtn.addEventListener('click', async () => {
        const element = document.getElementById('invoiceArea');
        const invoiceId = document.querySelector('.m-value').textContent || 'new';

        // Scroll to top avoids blank areas
        const currentScroll = window.scrollY;
        window.scrollTo(0, 0);
        
        // Strict body class instantly neutralizes mobile styles
        document.body.classList.add('export-active');

        const originalBtnText = downloadBtn.innerHTML;
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i><span>Exporting...</span>';
        lucide.createIcons();

        // Very small delay to guarantee the CSS reflows fully to desktop mode
        setTimeout(async () => {
            // Measure the exact newly reflowed height of the invoice
            // This allows us to dynamically create a PDF with the EXACT same height limit
            // Guarantees zero blank space and zero extra pages.
            const pdfWidth = element.offsetWidth || 800;
            const pdfHeight = element.offsetHeight || 1131;

            const opt = {
                margin:       0,
                filename:     `ProInvoice_${invoiceId.replace('#', '')}.pdf`,
                image:        { type: 'jpeg', quality: 1 },
                html2canvas:  { 
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff'
                },
                jsPDF:        { 
                    unit: 'px', 
                    format: [pdfWidth, pdfHeight], 
                    orientation: 'portrait' 
                }
            };

            try {
                await html2pdf().set(opt).from(element).save();
            } catch (error) {
                console.error('PDF Generation failed:', error);
            } finally {
                // Revert completely
                document.body.classList.remove('export-active');
                window.scrollTo(0, currentScroll); 
                downloadBtn.disabled = false;
                downloadBtn.innerHTML = originalBtnText;
                lucide.createIcons();
            }
        }, 150);
    });

    // Auto-save simulation (Local Storage)
    const editableFields = document.querySelectorAll('.editable-field');
    editableFields.forEach(field => {
        field.addEventListener('input', () => {
            // Logic for auto-saving can be added here
            console.log('Saved...');
        });
    });
});
