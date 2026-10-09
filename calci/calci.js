class Calculator {
    constructor() {
        this.expression = '';
        this.currentValue = '0';
        this.previousValue = '';
        this.operation = null;
        this.shouldResetScreen = false;
        this.lastOperation = null;
        this.lastValue = null;
        this.memory = 0;
        this.history = [];
        this.isScientific = false;
        this.isDegreeMode = true;
        this.pendingParentheses = 0;
        
        this.expressionEl = document.getElementById('expression');
        this.resultEl = document.getElementById('result');
        this.memoryIndicator = document.getElementById('memoryIndicator');
        this.standardButtons = document.getElementById('standardButtons');
        this.scientificButtons = document.getElementById('scientificButtons');
        this.historyPanel = document.getElementById('historyPanel');
        this.historyList = document.getElementById('historyList');
        this.historyEmpty = document.getElementById('historyEmpty');
        this.themeToggle = document.getElementById('themeToggle');
        this.historyToggle = document.getElementById('historyToggle');
        this.clearHistoryBtn = document.getElementById('clearHistory');
        this.modeTabs = document.querySelectorAll('.mode-tab');
        this.buttons = document.querySelectorAll('.btn');
        
        this.loadState();
        this.init();
    }
    
    init() {
        this.buttons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleClick(e));
        });
        
        this.modeTabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchMode(tab.dataset.mode));
        });
        
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.historyToggle.addEventListener('click', () => this.toggleHistory());
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        document.addEventListener('click', (e) => {
            if (!this.historyPanel.contains(e.target) && !this.historyToggle.contains(e.target)) {
                this.historyPanel.classList.remove('open');
            }
        });
        
        this.updateDisplay();
        this.updateMemoryIndicator();
        this.applyTheme();
    }
    
    loadState() {
        try {
            const saved = localStorage.getItem('calculatorState');
            if (saved) {
                const state = JSON.parse(saved);
                this.memory = state.memory || 0;
                this.history = state.history || [];
                this.isScientific = state.isScientific || false;
                this.isDegreeMode = state.isDegreeMode !== false;
            }
            const theme = localStorage.getItem('calculatorTheme') || 'dark';
            document.documentElement.setAttribute('data-theme', theme);
        } catch (e) {
            console.warn('Failed to load calculator state');
        }
    }
    
    saveState() {
        try {
            localStorage.setItem('calculatorState', JSON.stringify({
                memory: this.memory,
                history: this.history.slice(-50),
                isScientific: this.isScientific,
                isDegreeMode: this.isDegreeMode
            }));
        } catch (e) {
            console.warn('Failed to save calculator state');
        }
    }
    
    saveTheme(theme) {
        localStorage.setItem('calculatorTheme', theme);
    }
    
    applyTheme() {
        const theme = document.documentElement.getAttribute('data-theme');
        document.body.style.background = theme === 'light' 
            ? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
            : 'linear-gradient(135deg, #1e1e2e 0%, #2a2a4a 100%)';
    }
    
    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        this.saveTheme(newTheme);
        this.applyTheme();
    }
    
    toggleHistory() {
        this.historyPanel.classList.toggle('open');
        this.renderHistory();
    }
    
    switchMode(mode) {
        this.isScientific = mode === 'scientific';
        
        this.modeTabs.forEach(tab => {
            const isActive = tab.dataset.mode === mode;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', isActive);
        });
        
        this.standardButtons.hidden = this.isScientific;
        this.scientificButtons.hidden = !this.isScientific;
        
        this.saveState();
    }
    
    handleClick(e) {
        const btn = e.currentTarget;
        btn.classList.add('pressed');
        setTimeout(() => btn.classList.remove('pressed'), 100);
        
        const value = btn.dataset.value;
        const action = btn.dataset.action;
        
        if (value !== undefined) {
            this.inputNumber(value);
        } else if (action) {
            this.handleAction(action);
        }
    }
    
    handleKeyboard(e) {
        const key = e.key;
        
        if ((key >= '0' && key <= '9') || key === '.') {
            this.inputNumber(key);
            this.highlightKey(`[data-value="${key}"]`);
        } else if (key === '+' || key === '-') {
            this.handleAction(key === '+' ? 'add' : 'subtract');
            this.highlightKey(`[data-action="${key === '+' ? 'add' : 'subtract'}"]`);
        } else if (key === '*') {
            this.handleAction('multiply');
            this.highlightKey(`[data-action="multiply"]`);
        } else if (key === '/') {
            e.preventDefault();
            this.handleAction('divide');
            this.highlightKey(`[data-action="divide"]`);
        } else if (key === 'Enter' || key === '=') {
            this.handleAction('equals');
            this.highlightKey(`[data-action="equals"]`);
        } else if (key === 'Escape') {
            this.handleAction('clear');
            this.highlightKey(`[data-action="clear"]`);
        } else if (key === 'Backspace') {
            this.handleAction('backspace');
            this.highlightKey(`[data-action="backspace"]`);
        } else if (key === '%') {
            this.handleAction('percent');
            this.highlightKey(`[data-action="percent"]`);
        } else if (key === '(') {
            this.handleAction('leftParen');
        } else if (key === ')') {
            this.handleAction('rightParen');
        } else if (key === 'h' || key === 'H') {
            this.toggleHistory();
        } else if (key === 'm' || key === 'M') {
            if (e.ctrlKey || e.metaKey) return;
            this.handleAction('mr');
        }
    }
    
    highlightKey(selector) {
        const btn = document.querySelector(selector);
        if (btn) {
            btn.classList.add('pressed');
            setTimeout(() => btn.classList.remove('pressed'), 100);
        }
    }
    
    inputNumber(num) {
        if (this.shouldResetScreen) {
            this.currentValue = num === '.' ? '0.' : num;
            this.shouldResetScreen = false;
        } else {
            if (num === '.' && this.currentValue.includes('.')) return;
            if (this.currentValue === '0' && num !== '.') {
                this.currentValue = num;
            } else {
                if (this.currentValue.length >= 15) return;
                this.currentValue += num;
            }
        }
        this.updateDisplay();
    }
    
    handleAction(action) {
        switch (action) {
            case 'clear':
                this.clear();
                break;
            case 'backspace':
                this.backspace();
                break;
            case 'percent':
                this.percent();
                break;
            case 'add':
            case 'subtract':
            case 'multiply':
            case 'divide':
            case 'pow':
                this.setOperation(action);
                break;
            case 'equals':
                this.calculate();
                break;
            case 'sin': case 'cos': case 'tan':
            case 'asin': case 'acos': case 'atan':
            case 'log': case 'ln': case 'sqrt': case 'cbrt':
            case 'exp': case 'tenPow': case 'reciprocal':
            case 'xSquared': case 'xCubed': case 'factorial':
            case 'negate':
                this.scientificFunction(action);
                break;
            case 'pi':
                this.currentValue = Math.PI.toString();
                this.shouldResetScreen = true;
                break;
            case 'euler':
                this.currentValue = Math.E.toString();
                this.shouldResetScreen = true;
                break;
            case 'degRad':
                this.toggleDegreeMode();
                break;
            case 'random':
                this.currentValue = Math.random().toString();
                this.shouldResetScreen = true;
                break;
            case 'leftParen':
                this.inputParenthesis('(');
                break;
            case 'rightParen':
                this.inputParenthesis(')');
                break;
            case 'mc':
                this.memoryClear();
                break;
            case 'mr':
                this.memoryRecall();
                break;
            case 'madd':
                this.memoryAdd();
                break;
            case 'msub':
                this.memorySubtract();
                break;
        }
        this.updateDisplay();
    }
    
    clear() {
        this.expression = '';
        this.currentValue = '0';
        this.previousValue = '';
        this.operation = null;
        this.shouldResetScreen = false;
        this.lastOperation = null;
        this.lastValue = null;
        this.pendingParentheses = 0;
        this.clearActiveOperator();
    }
    
    backspace() {
        if (this.currentValue.length === 1 || (this.currentValue.length === 2 && this.currentValue.startsWith('-'))) {
            this.currentValue = '0';
        } else {
            this.currentValue = this.currentValue.slice(0, -1);
        }
    }
    
    percent() {
        this.currentValue = (parseFloat(this.currentValue) / 100).toString();
    }
    
    setOperation(op) {
        if (this.operation !== null && !this.shouldResetScreen) {
            this.calculate();
        }
        
        this.previousValue = this.currentValue;
        this.operation = op;
        this.shouldResetScreen = true;
        this.updateExpression();
        this.setActiveOperator(op);
    }
    
    calculate() {
        if (this.operation === null || this.shouldResetScreen) return;
        
        const prev = parseFloat(this.previousValue);
        const current = parseFloat(this.currentValue);
        let result;
        
        try {
            switch (this.operation) {
                case 'add':
                    result = prev + current;
                    break;
                case 'subtract':
                    result = prev - current;
                    break;
                case 'multiply':
                    result = prev * current;
                    break;
                case 'divide':
                    if (current === 0) throw new Error('Division by zero');
                    result = prev / current;
                    break;
                case 'pow':
                    result = Math.pow(prev, current);
                    break;
                default:
                    return;
            }
            
            if (!isFinite(result)) throw new Error('Result too large');
            
            const expr = `${this.previousValue} ${this.getOperatorSymbol(this.operation)} ${this.currentValue}`;
            this.addToHistory(expr, result);
            
            this.lastOperation = this.operation;
            this.lastValue = this.currentValue;
            
            this.currentValue = this.formatResult(result);
            this.expression = `${expr} =`;
            this.operation = null;
            this.shouldResetScreen = true;
            this.clearActiveOperator();
            
        } catch (error) {
            this.showError(error.message);
        }
    }
    
    scientificFunction(fn) {
        const value = parseFloat(this.currentValue);
        let result;
        let expr = '';
        
        try {
            const deg = this.isDegreeMode ? Math.PI / 180 : 1;
            
            switch (fn) {
                case 'sin': result = Math.sin(value * deg); expr = `sin(${this.currentValue})`; break;
                case 'cos': result = Math.cos(value * deg); expr = `cos(${this.currentValue})`; break;
                case 'tan': result = Math.tan(value * deg); expr = `tan(${this.currentValue})`; break;
                case 'asin': result = Math.asin(value) / deg; expr = `sin⁻¹(${this.currentValue})`; break;
                case 'acos': result = Math.acos(value) / deg; expr = `cos⁻¹(${this.currentValue})`; break;
                case 'atan': result = Math.atan(value) / deg; expr = `tan⁻¹(${this.currentValue})`; break;
                case 'log': if (value <= 0) throw new Error('Invalid input'); result = Math.log10(value); expr = `log(${this.currentValue})`; break;
                case 'ln': if (value <= 0) throw new Error('Invalid input'); result = Math.log(value); expr = `ln(${this.currentValue})`; break;
                case 'sqrt': if (value < 0) throw new Error('Invalid input'); result = Math.sqrt(value); expr = `√(${this.currentValue})`; break;
                case 'cbrt': result = Math.cbrt(value); expr = `∛(${this.currentValue})`; break;
                case 'exp': result = Math.exp(value); expr = `e^(${this.currentValue})`; break;
                case 'tenPow': result = Math.pow(10, value); expr = `10^(${this.currentValue})`; break;
                case 'reciprocal': if (value === 0) throw new Error('Division by zero'); result = 1 / value; expr = `1/(${this.currentValue})`; break;
                case 'xSquared': result = value * value; expr = `(${this.currentValue})²`; break;
                case 'xCubed': result = value * value * value; expr = `(${this.currentValue})³`; break;
                case 'factorial': if (value < 0 || value > 170 || !Number.isInteger(value)) throw new Error('Invalid input'); result = this.factorial(value); expr = `(${this.currentValue})!`; break;
                case 'negate': result = -value; expr = `-(${this.currentValue})`; break;
                default: return;
            }
            
            if (!isFinite(result)) throw new Error('Result too large');
            
            this.addToHistory(expr, result);
            this.currentValue = this.formatResult(result);
            this.expression = `${expr} =`;
            this.shouldResetScreen = true;
            this.clearActiveOperator();
            
        } catch (error) {
            this.showError(error.message);
        }
    }
    
    factorial(n) {
        let result = 1;
        for (let i = 2; i <= n; i++) result *= i;
        return result;
    }
    
    toggleDegreeMode() {
        this.isDegreeMode = !this.isDegreeMode;
        const btn = document.querySelector('[data-action="degRad"]');
        if (btn) btn.textContent = this.isDegreeMode ? 'DEG' : 'RAD';
        this.showToast(this.isDegreeMode ? 'Degree mode' : 'Radian mode');
        this.saveState();
    }
    
    inputParenthesis(paren) {
        if (paren === '(') {
            if (this.currentValue !== '0' && !this.shouldResetScreen) {
                this.setOperation('multiply');
            }
            this.expression += '(';
            this.pendingParentheses++;
            this.currentValue = '0';
            this.shouldResetScreen = false;
        } else {
            if (this.pendingParentheses > 0) {
                this.expression += this.currentValue + ')';
                this.pendingParentheses--;
                this.shouldResetScreen = true;
            }
        }
        this.updateDisplay();
    }
    
    memoryClear() { this.memory = 0; this.updateMemoryIndicator(); this.saveState(); this.showToast('Memory cleared'); }
    memoryRecall() { this.currentValue = this.formatResult(this.memory); this.shouldResetScreen = true; this.updateDisplay(); this.showToast('Memory recalled'); }
    memoryAdd() { this.memory += parseFloat(this.currentValue); this.updateMemoryIndicator(); this.saveState(); this.showToast('Added to memory'); }
    memorySubtract() { this.memory -= parseFloat(this.currentValue); this.updateMemoryIndicator(); this.saveState(); this.showToast('Subtracted from memory'); }
    
    updateMemoryIndicator() {
        this.memoryIndicator.hidden = this.memory === 0;
    }
    
    addToHistory(expr, result) {
        this.history.unshift({ expression: expr, result: this.formatResult(result), timestamp: Date.now() });
        if (this.history.length > 50) this.history.pop();
        this.saveState();
        if (this.historyPanel.classList.contains('open')) this.renderHistory();
    }
    
    renderHistory() {
        if (this.history.length === 0) {
            this.historyEmpty.hidden = false;
            this.historyList.innerHTML = '';
            return;
        }
        
        this.historyEmpty.hidden = true;
        this.historyList.innerHTML = this.history.map(item => `
            <div class="history-item" data-result="${item.result}">
                <div class="history-item expression">${item.expression}</div>
                <div class="history-item result">${item.result}</div>
            </div>
        `).join('');
        
        this.historyList.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                this.currentValue = item.dataset.result;
                this.shouldResetScreen = true;
                this.updateDisplay();
                this.historyPanel.classList.remove('open');
            });
        });
    }
    
    clearHistory() {
        this.history = [];
        this.saveState();
        this.renderHistory();
        this.showToast('History cleared');
    }
    
    formatResult(num) {
        if (!isFinite(num)) return 'Error';
        
        const str = num.toString();
        if (str.includes('e')) {
            return num.toPrecision(10).replace(/\.?0+$/, '');
        }
        
        if (str.includes('.')) {
            const decimalPlaces = str.split('.')[1].length;
            if (decimalPlaces > 10) {
                return num.toFixed(10).replace(/\.?0+$/, '');
            }
        }
        
        return str.length > 15 ? num.toExponential(6) : str;
    }
    
    getOperatorSymbol(op) {
        const symbols = {
            'add': '+', 'subtract': '−', 'multiply': '×', 'divide': '÷', 'pow': '^'
        };
        return symbols[op] || op;
    }
    
    updateExpression() {
        if (this.operation && this.previousValue !== '') {
            this.expression = `${this.previousValue} ${this.getOperatorSymbol(this.operation)}`;
        }
    }
    
    updateDisplay() {
        this.expressionEl.textContent = this.expression;
        this.resultEl.textContent = this.currentValue || '0';
        
        this.resultEl.classList.add('animate');
        setTimeout(() => this.resultEl.classList.remove('animate'), 100);
    }
    
    setActiveOperator(op) {
        this.clearActiveOperator();
        const btn = document.querySelector(`[data-action="${op}"]`);
        if (btn) btn.classList.add('active');
    }
    
    clearActiveOperator() {
        document.querySelectorAll('.operator').forEach(btn => btn.classList.remove('active'));
    }
    
    showError(message) {
        this.resultEl.textContent = message;
        this.resultEl.style.color = '#f87171';
        this.resultEl.classList.add('shake');
        setTimeout(() => {
            this.clear();
            this.resultEl.style.color = '';
            this.resultEl.classList.remove('shake');
        }, 1500);
    }
    
    showToast(message) {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Calculator();
});