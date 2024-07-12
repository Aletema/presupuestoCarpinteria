document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("budget-form");
    const materialsTable = document.getElementById("materials-table").getElementsByTagName("tbody")[0];
    const materialsTotalEl = document.getElementById("materials-total");
    const laborCostTotalEl = document.getElementById("labor-cost-total");
    const finalTotalEl = document.getElementById("final-total");
    const totalTextEl = document.getElementById("total-text");
    const laborPercentageInput = document.getElementById("labor-percentage");
    const calculateLaborCostBtn = document.getElementById("calculate-labor-cost");
    const generatePdfBtn = document.getElementById("generate-pdf");
    const clientNameInput = document.getElementById("client-name");

    let totalMaterialsCost = 0;

    form.addEventListener("submit", function(event) {
        event.preventDefault();

        const material = document.getElementById("material").value;
        const cantidad = parseFloat(document.getElementById("cantidad").value);
        const precioUnitario = parseFloat(document.getElementById("precio-unitario").value);

        if (!material || isNaN(cantidad) || isNaN(precioUnitario)) {
            Swal.fire({
                icon: 'error',
                title: 'Campos incompletos',
                text: 'Por favor, completa todos los campos del formulario.'
            });
            return;
        }

        const precioTotal = cantidad * precioUnitario;

        const row = materialsTable.insertRow();
        row.insertCell(0).textContent = material;
        row.insertCell(1).textContent = cantidad;
        row.insertCell(2).textContent = numeral(precioUnitario).format('0,0.00');
        row.insertCell(3).textContent = numeral(precioTotal).format('0,0.00');

        totalMaterialsCost += precioTotal;
        materialsTotalEl.textContent = numeral(totalMaterialsCost).format('0,0.00');

        form.reset();
    });

    calculateLaborCostBtn.addEventListener("click", function() {
        const laborPercentage = parseFloat(laborPercentageInput.value);

        if (isNaN(laborPercentage) || laborPercentage < 0) {
            Swal.fire({
                icon: 'error',
                title: 'Porcentaje inválido',
                text: 'Por favor, ingresa un porcentaje válido para la mano de obra.'
            });
            return;
        }

        const laborCost = totalMaterialsCost * (laborPercentage / 100);
        const finalTotal = totalMaterialsCost + laborCost;

        laborCostTotalEl.textContent = numeral(laborCost).format('0,0.00');
        finalTotalEl.textContent = numeral(finalTotal).format('0,0.00');
        totalTextEl.value = numberToWords(finalTotal);
    });

    generatePdfBtn.addEventListener("click", function() {
        if (materialsTable.rows.length === 0) {
            Swal.fire({
                icon: 'error',
                title: 'Sin datos',
                text: 'No hay datos para generar el PDF.'
            });
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const clientName = clientNameInput.value;
        const materials = [];
        for (let i = 0; i < materialsTable.rows.length; i++) {
            const row = materialsTable.rows[i];
            const material = row.cells[0].textContent;
            const cantidad = row.cells[1].textContent;
            const precioUnitario = row.cells[2].textContent;
            const precioTotal = row.cells[3].textContent;
            materials.push([material, cantidad, `$${precioUnitario}`, `$${precioTotal}`]);
        }

        doc.setFontSize(16);
        doc.text("Presupuesto de Carpintería", 10, 10);
        doc.setFontSize(12);
        doc.text(`Nombre del Cliente: ${clientName}`, 10, 20);

        doc.autoTable({
            startY: 30,
            head: [['Material', 'Cantidad', 'Precio Unitario', 'Precio Total']],
            body: materials
        });

        const finalY = doc.autoTable.previous.finalY;
        doc.text(`Valor de Materiales: $${materialsTotalEl.textContent}`, 10, finalY + 10);
        doc.text(`Valor de la Mano de Obra: $${laborCostTotalEl.textContent}`, 10, finalY + 20);
        doc.text(`Total Final: $${finalTotalEl.textContent}`, 10, finalY + 30);
        doc.text(`Total en Letras: ${totalTextEl.value}`, 10, finalY + 40);

        doc.save('presupuesto.pdf');
    });

    function numberToWords(num) {
        const units = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
        const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
        const tens = ['veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
        const hundreds = ['cien', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

        function getUnits(num) {
            return units[num];
        }

        function getTens(num) {
            if (num < 10) return getUnits(num);
            if (num < 20) return teens[num - 10];
            const ten = Math.floor(num / 10);
            const unit = num % 10;
            return tens[ten - 2] + (unit ? ' y ' + getUnits(unit) : '');
        }

        function getHundreds(num) {
            if (num < 100) return getTens(num);
            const hundred = Math.floor(num / 100);
            const rest = num % 100;
            return (hundred === 1 ? 'ciento' : hundreds[hundred - 1]) + (rest ? ' ' + getTens(rest) : '');
        }

        function getThousands(num) {
            if (num < 1000) return getHundreds(num);
            const thousand = Math.floor(num / 1000);
            const rest = num % 1000;
            if (thousand === 1) return 'mil' + (rest ? ' ' + getHundreds(rest) : '');
            if (thousand < 10) return getUnits(thousand) + ' mil' + (rest ? ' ' + getHundreds(rest) : '');
            if (thousand < 100) return getTens(thousand) + ' mil' + (rest ? ' ' + getHundreds(rest) : '');
            return getHundreds(thousand) + ' mil' + (rest ? ' ' + getHundreds(rest) : '');
        }

        function getMillions(num) {
            if (num < 1000000) return getThousands(num);
            const million = Math.floor(num / 1000000);
            const rest = num % 1000000;
            if (million === 1) return 'un millón' + (rest ? ' ' + getThousands(rest) : '');
            return getUnits(million) + ' millones' + (rest ? ' ' + getThousands(rest) : '');
        }

        function getBillions(num) {
            if (num < 1000000000) return getMillions(num);
            const billion = Math.floor(num / 1000000000);
            const rest = num % 1000000000;
            if (billion === 1) return 'mil millones' + (rest ? ' ' + getMillions(rest) : '');
            return getUnits(billion) + ' mil millones' + (rest ? ' ' + getMillions(rest) : '');
        }

        if (num === 0) return 'cero';
        if (num >= 1000000000000) return 'Número fuera de rango';
        return getBillions(num);
    }
});
