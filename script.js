document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('customerForm');
    const searchBox = document.getElementById('searchBox');
    const customerRecords = document.getElementById('customerRecords');
    const totalPaid = document.getElementById('totalPaid');
    const totalRemaining = document.getElementById('totalRemaining');
    const calendar = document.getElementById('calendar');
    let selectedDate = new Date().toLocaleDateString('en-GB'); // Default to today

    let calendarData = JSON.parse(localStorage.getItem('calendarData')) || {};

    function renderCustomers(date) {
        customerRecords.innerHTML = '';
        let totalPaidAmount = 0;
        let totalRemainingAmount = 0;

        if (calendarData[date]) {
            calendarData[date].forEach(customer => {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <h4>${customer.name}</h4>
                    <p><strong>Water Taken:</strong> ${customer.water} liters</p>
                    <p><strong>Amount Paid:</strong> ${customer.amountPaid} INR</p>
                    <p><strong>Remaining Amount:</strong> ${customer.remainingAmount} INR</p>
                    <button class="edit-button" data-name="${customer.name}">Edit</button>
                    <button class="delete-button" data-name="${customer.name}">Delete</button>
                `;
                customerRecords.appendChild(card);

                totalPaidAmount += customer.amountPaid;
                totalRemainingAmount += customer.remainingAmount;
            });
        }

        totalPaid.textContent = totalPaidAmount;
        totalRemaining.textContent = totalRemainingAmount;
    }

    function updateLocalStorage() {
        localStorage.setItem('calendarData', JSON.stringify(calendarData));
    }

    function initializeCalendar() {
        const currentDate = new Date();
        let currentYear = currentDate.getFullYear();
        let currentMonth = currentDate.getMonth();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        const calendarHeader = document.createElement('div');
        calendarHeader.id = 'calendarHeader';
        calendarHeader.innerHTML = `
            <button class="calendar-button" id="prevMonth">❮</button>
            <h3>${monthNames[currentMonth]} ${currentYear}</h3>
            <button class="calendar-button" id="nextMonth">❯</button>
        `;

        calendar.appendChild(calendarHeader);

        const monthGrid = document.createElement('div');
        monthGrid.className = 'calendar-month';

        for (let day = 1; day <= daysInMonth; day++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            dayDiv.textContent = day;

            dayDiv.addEventListener('click', function () {
                selectedDate = `${day < 10 ? '0' : ''}${day}-${currentMonth + 1 < 10 ? '0' : ''}${currentMonth + 1}-${currentYear}`;
                renderCustomers(selectedDate);
                const selectedDays = document.querySelectorAll('.calendar-day.selected');
                selectedDays.forEach(d => d.classList.remove('selected'));
                dayDiv.classList.add('selected');
            });

            monthGrid.appendChild(dayDiv);
        }

        calendar.appendChild(monthGrid);
        renderCustomers(selectedDate);

        document.getElementById('prevMonth').addEventListener('click', function () {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            initializeCalendar();
        });

        document.getElementById('nextMonth').addEventListener('click', function () {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            initializeCalendar();
        });
    }

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        const customerName = document.getElementById('customerName').value;
        const waterAmount = parseFloat(document.getElementById('waterAmount').value);
        const amountPaid = parseFloat(document.getElementById('amountPaid').value);
        const remainingAmount = waterAmount - amountPaid;

        if (!calendarData[selectedDate]) {
            calendarData[selectedDate] = [];
        }

        const existingCustomer = calendarData[selectedDate].find(customer => customer.name === customerName);
        if (existingCustomer) {
            existingCustomer.water += waterAmount;
            existingCustomer.amountPaid += amountPaid;
            existingCustomer.remainingAmount = existingCustomer.water - existingCustomer.amountPaid;
        } else {
            calendarData[selectedDate].push({
                name: customerName,
                water: waterAmount,
                amountPaid: amountPaid,
                remainingAmount: remainingAmount
            });
        }

        updateLocalStorage();
        renderCustomers(selectedDate);
        form.reset();
    });

    customerRecords.addEventListener('click', function (event) {
        const target = event.target;
        const customerName = target.dataset.name;

        if (target.classList.contains('edit-button')) {
            const customer = calendarData[selectedDate].find(c => c.name === customerName);
            document.getElementById('customerName').value = customer.name;
            document.getElementById('waterAmount').value = customer.water;
            document.getElementById('amountPaid').value = customer.amountPaid;
            calendarData[selectedDate] = calendarData[selectedDate].filter(c => c.name !== customerName);
            updateLocalStorage();
            renderCustomers(selectedDate);
        }

        if (target.classList.contains('delete-button')) {
            calendarData[selectedDate] = calendarData[selectedDate].filter(c => c.name !== customerName);
            updateLocalStorage();
            renderCustomers(selectedDate);
        }
    });

    document.getElementById('downloadExcel').addEventListener('click', function () {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(calendarData[selectedDate] || []);
        XLSX.utils.book_append_sheet(wb, ws, 'Monthly Data');
        XLSX.writeFile(wb, 'monthly_data.xlsx');
    });

    document.getElementById('downloadPDF').addEventListener('click', function () {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text(`Water Supply Data for ${selectedDate}`, 10, 10);
        let y = 20;

        (calendarData[selectedDate] || []).forEach(customer => {
            doc.text(`Customer: ${customer.name}`, 10, y);
            doc.text(`Water Taken: ${customer.water} liters`, 10, y + 10);
            doc.text(`Amount Paid: ${customer.amountPaid} INR`, 10, y + 20);
            doc.text(`Remaining Amount: ${customer.remainingAmount} INR`, 10, y + 30);
            y += 40;
        });

        doc.save('monthly_data.pdf');
    });

    document.getElementById('downloadMonthlyData').addEventListener('click', function () {
        const selectedMonth = document.getElementById('monthlyDataSelector').value;
        if (!selectedMonth) {
            alert('Please select a month.');
            return;
        }

        const monthYear = new Date(selectedMonth);
        const year = monthYear.getFullYear();
        const month = monthYear.getMonth() + 1; // months are 0-based

        let monthlyData = [];
        for (const date in calendarData) {
            const [day, monthStored, yearStored] = date.split('-').map(Number);
            if (monthStored === month && yearStored === year) {
                monthlyData = monthlyData.concat(calendarData[date]);
            }
        }

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(monthlyData);
        XLSX.utils.book_append_sheet(wb, ws, 'Monthly Data');
        XLSX.writeFile(wb, `monthly_data_${month}-${year}.xlsx`);
    });

    initializeCalendar();
});
