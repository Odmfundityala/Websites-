class ResultsManager {
    constructor() {
        this.results = [];
        this.init();
    }

    init() {
        this.loadResults();
        this.setupForm();
        this.setupFilters();
    }

    async loadResults() {
        try {
            const response = await fetch('/api/results?t=' + Date.now());
            if (response.ok) {
                this.results = await response.json();
                this.displayResults();
                this.updateYearFilter();
            }
        } catch (error) {
            console.error('Error loading results:', error);
        }
    }

    setupForm() {
        const form = document.getElementById('resultsForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.saveResult();
            });
        }
    }

    setupFilters() {
        const yearFilter = document.getElementById('filterYear');
        const gradeFilter = document.getElementById('filterGrade');
        
        if (yearFilter) {
            yearFilter.addEventListener('change', () => this.displayResults());
        }
        if (gradeFilter) {
            gradeFilter.addEventListener('change', () => this.displayResults());
        }
    }

    updateYearFilter() {
        const yearFilter = document.getElementById('filterYear');
        if (!yearFilter) return;
        
        const years = [...new Set(this.results.map(r => r.year))].sort((a, b) => b - a);
        yearFilter.innerHTML = '<option value="">All Years</option>';
        years.forEach(year => {
            yearFilter.innerHTML += `<option value="${year}">${year}</option>`;
        });
    }

    async saveResult() {
        const year = document.getElementById('resultYear').value;
        const grade = document.getElementById('resultGrade').value;
        const subject = document.getElementById('resultSubject').value;
        const passRate = document.getElementById('resultPassRate').value;
        const enrolled = document.getElementById('resultEnrolled').value;
        const passed = document.getElementById('resultPassed').value;
        const notes = document.getElementById('resultNotes').value;

        if (!year || !grade || !subject || !passRate) {
            this.showMessage('Please fill in all required fields', 'error');
            return;
        }

        const result = {
            year: parseInt(year),
            grade,
            subject,
            passRate: parseFloat(passRate),
            enrolled: enrolled ? parseInt(enrolled) : null,
            passed: passed ? parseInt(passed) : null,
            notes
        };

        try {
            const response = await fetch('/api/results', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result)
            });

            if (response.ok) {
                this.showMessage('Result saved successfully!', 'success');
                document.getElementById('resultsForm').reset();
                await this.loadResults();
            } else {
                this.showMessage('Failed to save result', 'error');
            }
        } catch (error) {
            console.error('Error saving result:', error);
            this.showMessage('Error saving result', 'error');
        }
    }

    async deleteResult(id) {
        if (!confirm('Are you sure you want to delete this result?')) return;

        try {
            const response = await fetch(`/api/results?id=${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showMessage('Result deleted successfully!', 'success');
                await this.loadResults();
            } else {
                this.showMessage('Failed to delete result', 'error');
            }
        } catch (error) {
            console.error('Error deleting result:', error);
            this.showMessage('Error deleting result', 'error');
        }
    }

    displayResults() {
        const container = document.getElementById('resultsList');
        if (!container) return;

        const yearFilter = document.getElementById('filterYear')?.value;
        const gradeFilter = document.getElementById('filterGrade')?.value;

        let filtered = this.results;
        if (yearFilter) {
            filtered = filtered.filter(r => r.year == yearFilter);
        }
        if (gradeFilter) {
            filtered = filtered.filter(r => r.grade.includes(gradeFilter));
        }

        if (filtered.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 2rem;">No results found.</p>';
            return;
        }

        const grouped = {};
        filtered.forEach(r => {
            const key = `${r.year} - ${r.grade}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(r);
        });

        let html = '';
        Object.keys(grouped).sort().reverse().forEach(key => {
            html += `
                <div style="margin-bottom: 1.5rem; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #1a365d, #2c5282); color: white; padding: 1rem; font-weight: 600;">
                        <i class="fas fa-graduation-cap"></i> ${key}
                    </div>
                    <div style="padding: 1rem;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                            <thead>
                                <tr style="background: #f8fafc;">
                                    <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #e2e8f0;">Subject</th>
                                    <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #e2e8f0;">Pass Rate</th>
                                    <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #e2e8f0;">Enrolled</th>
                                    <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #e2e8f0;">Passed</th>
                                    <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #e2e8f0;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
            `;
            
            grouped[key].forEach(result => {
                const passColor = result.passRate >= 80 ? '#10b981' : result.passRate >= 60 ? '#f59e0b' : '#ef4444';
                html += `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 0.75rem;">${result.subject}</td>
                        <td style="padding: 0.75rem; text-align: center;">
                            <span style="background: ${passColor}; color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-weight: 600;">${result.passRate}%</span>
                        </td>
                        <td style="padding: 0.75rem; text-align: center;">${result.enrolled || '-'}</td>
                        <td style="padding: 0.75rem; text-align: center;">${result.passed || '-'}</td>
                        <td style="padding: 0.75rem; text-align: center;">
                            <button onclick="resultsManager.deleteResult(${result.id})" style="background: #fee2e2; color: #dc2626; border: none; padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            html += '</tbody></table></div></div>';
        });

        container.innerHTML = html;
    }

    showMessage(message, type) {
        const existing = document.querySelector('.results-message');
        if (existing) existing.remove();

        const div = document.createElement('div');
        div.className = 'results-message';
        div.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 9999;
            animation: slideIn 0.3s ease;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
        `;
        div.textContent = message;
        document.body.appendChild(div);

        setTimeout(() => div.remove(), 3000);
    }
}

let resultsManager;
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('resultsForm') || document.getElementById('resultsList')) {
        resultsManager = new ResultsManager();
    }
});
