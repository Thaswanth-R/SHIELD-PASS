/**
 * SHIELD PASS - Core Dashboard Application Coordinator (3-Tab Layout)
 */

document.addEventListener('DOMContentLoaded', () => {
    // Application State
    const state = {
        activeTab: 'evaluator',
        vaultUnlocked: false,
        masterPassword: '',
        activeSimulator: null,
        generatedPassword: '',
        generatorPreset: 'alphanumeric'
    };

    // DOM Elements
    const elements = {
        // Navigation & Titles
        navItems: document.querySelectorAll('.nav-item'),
        tabPanels: document.querySelectorAll('.tab-panel'),
        pageTitle: document.getElementById('page-title'),
        pageSubtitle: document.getElementById('page-subtitle'),
        postureValSidebar: document.getElementById('posture-val-sidebar'),
        postureFillSidebar: document.getElementById('posture-fill-sidebar'),
        globalResetBtn: document.getElementById('global-reset-btn'),

        // Dashboard/Vault Stats (Integrated into Vault unlocked state)
        dashboardGaugeFill: document.getElementById('dashboard-gauge-fill'),
        dashboardGaugeScore: document.getElementById('dashboard-gauge-score'),
        postureHeading: document.getElementById('posture-status-heading'),
        postureDesc: document.getElementById('posture-status-desc'),
        statsVaultCount: document.getElementById('stats-vault-count'),
        statsAvgEntropy: document.getElementById('stats-avg-entropy'),
        statsVaultStatus: document.getElementById('stats-vault-status'),

        // Strength Checker Elements
        evalPasswordInput: document.getElementById('eval-password-input'),
        toggleEvalPassword: document.getElementById('toggle-eval-password-visibility'),
        evalStrengthLabel: document.getElementById('eval-strength-label'),
        meterTracks: [
            document.getElementById('meter-track-1'),
            document.getElementById('meter-track-2'),
            document.getElementById('meter-track-3'),
            document.getElementById('meter-track-4')
        ],
        evalEntropyVal: document.getElementById('eval-entropy-val'),
        evalPoolVal: document.getElementById('eval-pool-val'),
        evalCombosVal: document.getElementById('eval-combos-val'),
        chkLower: document.getElementById('chk-lower'),
        chkUpper: document.getElementById('chk-upper'),
        chkDigits: document.getElementById('chk-digits'),
        chkSymbols: document.getElementById('chk-symbols'),
        adversaryGridContainer: document.getElementById('adversary-grid-container'),

        // Simulator
        simStartBtn: document.getElementById('sim-start-btn'),
        simStopBtn: document.getElementById('sim-stop-btn'),
        simTerminal: document.getElementById('simulator-terminal'),
        simMatrixDisplay: document.getElementById('sim-matrix-display'),
        simGuesses: document.getElementById('sim-stat-guesses'),
        simTime: document.getElementById('sim-stat-time'),
        simPercent: document.getElementById('sim-stat-percent'),
        simProgressFill: document.getElementById('sim-progress-fill'),

        // Integrity Tab
        hashInput1: document.getElementById('hash-input-1'),
        hashInput2: document.getElementById('hash-input-2'),
        hashOutputText1: document.getElementById('hash-output-text-1'),
        hashOutputText2: document.getElementById('hash-output-text-2'),
        hashVisual1: document.getElementById('hash-visual-1'),
        hashVisual2: document.getElementById('hash-visual-2'),
        avalancheMatchCount: document.getElementById('avalanche-match-count'),
        avalancheDiffFactor: document.getElementById('avalanche-diff-factor'),
        avalancheRating: document.getElementById('avalanche-rating'),

        // Vault Tab
        vaultLockedState: document.getElementById('vault-locked-state'),
        vaultUnlockedState: document.getElementById('vault-unlocked-state'),
        vaultSetupForm: document.getElementById('vault-setup-form'),
        vaultLoginForm: document.getElementById('vault-login-form'),
        vaultSetupPwd: document.getElementById('vault-setup-pwd'),
        vaultSetupPwdConfirm: document.getElementById('vault-setup-pwd-confirm'),
        vaultSetupBtn: document.getElementById('vault-setup-btn'),
        vaultUnlockPwd: document.getElementById('vault-unlock-pwd'),
        vaultUnlockBtn: document.getElementById('vault-unlock-btn'),
        vaultSearchInput: document.getElementById('vault-search-input'),
        vaultLockBtn: document.getElementById('vault-lock-btn'),
        openAddCardBtn: document.getElementById('open-add-card-btn'),
        vaultCardsContainer: document.getElementById('vault-cards-container'),

        // Add Card Modal
        addCardModal: document.getElementById('add-card-modal'),
        closeAddCardModal: document.getElementById('close-add-card-modal'),
        cancelAddCardBtn: document.getElementById('cancel-add-card-btn'),
        saveCardBtn: document.getElementById('save-card-btn'),
        addSiteName: document.getElementById('add-site-name'),
        addUsername: document.getElementById('add-username'),
        addPassword: document.getElementById('add-password'),
        addPasswordGeneratorBtn: document.getElementById('add-password-generator-btn'),
        toggleAddPassword: document.getElementById('toggle-add-password-visibility'),

        // Generator section (within Evaluator tab)
        genLengthSlider: document.getElementById('gen-length-slider'),
        genLengthVal: document.getElementById('gen-length-val'),
        genPresetCards: document.querySelectorAll('.preset-card'),
        genCheckboxesContainer: document.getElementById('gen-checkboxes-container'),
        genOptLower: document.getElementById('gen-opt-lower'),
        genOptUpper: document.getElementById('gen-opt-upper'),
        genOptDigits: document.getElementById('gen-opt-digits'),
        genOptSymbols: document.getElementById('gen-opt-symbols'),
        genSubmitBtn: document.getElementById('gen-submit-btn'),
        genOutputInput: document.getElementById('gen-output-input'),
        genCopyBtn: document.getElementById('gen-copy-btn'),
        genEntropyVal: document.getElementById('gen-entropy-val'),
        genVerdictVal: document.getElementById('gen-verdict-val'),
        evalApplyGenPwd: document.getElementById('eval-apply-gen-pwd'),

        // Toast
        toastRoot: document.getElementById('toast-root')
    };

    // Metadata for the 3 tabs
    const tabMetaData = {
        evaluator: { title: 'Evaluator & Generator', subtitle: 'Detailed evaluation of combinatorial search-space & adversarial cracking estimation.' },
        integrity: { title: 'Integrity & Avalanche', subtitle: 'Visualizing cryptographic one-way hashes and the avalanche effect.' },
        vault: { title: 'Secure Vault', subtitle: 'PBKDF2/AES-GCM client-side encrypted credentials store.' }
    };

    /* ==========================================================================
       TOAST NOTIFICATION ENGINE
       ========================================================================== */
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = 'ℹ️';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '❌';

        toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
        elements.toastRoot.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /* ==========================================================================
       NAVIGATION ROUTING
       ========================================================================== */
    elements.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = item.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });

    function switchTab(tabId) {
        state.activeTab = tabId;

        // Update navigation classes
        elements.navItems.forEach(item => {
            if (item.getAttribute('data-tab') === tabId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Update Panels
        elements.tabPanels.forEach(panel => {
            if (panel.id === `tab-${tabId}`) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });

        // Update titles
        const meta = tabMetaData[tabId] || { title: 'Evaluator', subtitle: '' };
        elements.pageTitle.textContent = meta.title;
        elements.pageSubtitle.textContent = meta.subtitle;

        // Auto trigger default states on navigate
        if (tabId === 'integrity') {
            runIntegrityChecks();
        }
        if (tabId === 'evaluator' && !elements.genOutputInput.value) {
            triggerGeneration();
        }
        if (tabId === 'vault') {
            updateDashboardStats();
        }
    }

    /* ==========================================================================
       SECURITY POSTURE METRICS (INTEGRATED DASHBOARD)
       ========================================================================== */
    async function updateDashboardStats() {
        const isVaultSetup = ShieldPassVault.isSetup();
        
        if (!isVaultSetup) {
            if (elements.statsVaultStatus) elements.statsVaultStatus.textContent = 'UNCONFIGURED';
            if (elements.statsVaultStatus) elements.statsVaultStatus.style.color = 'var(--neon-danger)';
        } else if (state.vaultUnlocked) {
            if (elements.statsVaultStatus) elements.statsVaultStatus.textContent = 'UNLOCKED';
            if (elements.statsVaultStatus) elements.statsVaultStatus.style.color = 'var(--neon-success)';
        } else {
            if (elements.statsVaultStatus) elements.statsVaultStatus.textContent = 'LOCKED';
            if (elements.statsVaultStatus) elements.statsVaultStatus.style.color = 'var(--neon-warning)';
        }

        // Vault statistics parsing
        let count = 0;
        let avgEntropy = 0;
        let totalEntropy = 0;

        if (state.vaultUnlocked && state.masterPassword) {
            try {
                const creds = await ShieldPassVault.load(state.masterPassword);
                count = creds.length;
                
                if (count > 0) {
                    creds.forEach(c => {
                        const score = ShieldPassCrypto.calculateEntropy(c.password);
                        totalEntropy += score.entropy;
                    });
                    avgEntropy = Math.round(totalEntropy / count);
                }
            } catch (e) {
                console.error(e);
            }
        }

        if (elements.statsVaultCount) elements.statsVaultCount.textContent = count;
        if (elements.statsAvgEntropy) elements.statsAvgEntropy.textContent = avgEntropy;

        // Posture Score formula
        let score = 20; // baseline
        if (isVaultSetup) score += 20;
        if (state.vaultUnlocked) score += 20;
        
        if (count > 0) {
            const entropyContribution = Math.min(40, (avgEntropy / 120) * 40);
            score += Math.round(entropyContribution);
        }

        // Apply score indicators
        if (elements.postureValSidebar) elements.postureValSidebar.textContent = `${score}%`;
        if (elements.postureFillSidebar) elements.postureFillSidebar.style.width = `${score}%`;

        // Update Vault Dashboard elements if unlocked
        if (state.vaultUnlocked) {
            if (elements.dashboardGaugeScore) elements.dashboardGaugeScore.textContent = score;
            
            const offset = 440 - (440 * score) / 100;
            if (elements.dashboardGaugeFill) {
                elements.dashboardGaugeFill.style.strokeDashoffset = offset;
                if (score >= 80) {
                    elements.dashboardGaugeFill.style.stroke = 'var(--neon-success)';
                } else if (score >= 50) {
                    elements.dashboardGaugeFill.style.stroke = 'var(--neon-info)';
                } else {
                    elements.dashboardGaugeFill.style.stroke = 'var(--neon-danger)';
                }
            }

            let heading = 'Defenses Vulnerable';
            let desc = 'Security rating is low. Add strong generated passwords to raise entropy metrics.';
            let color = 'var(--neon-danger)';

            if (score >= 80) {
                color = 'var(--neon-success)';
                heading = 'Perimeter Fortified';
                desc = 'All cards hold high entropy, encrypted with local PBKDF2/AES key blocks.';
            } else if (score >= 50) {
                color = 'var(--neon-info)';
                heading = 'Defenses Resilient';
                desc = 'Active encryption keys loaded. Swap moderate-strength credentials to reach 100%.';
            }

            if (elements.postureHeading) {
                elements.postureHeading.textContent = heading;
                elements.postureHeading.style.color = color;
            }
            if (elements.postureDesc) elements.postureDesc.textContent = desc;
        }
    }

    /* ==========================================================================
       STRENGTH EVALUATOR MODULE
       ========================================================================== */
    elements.evalPasswordInput.addEventListener('input', () => {
        runStrengthEvaluation();
    });

    elements.toggleEvalPassword.addEventListener('click', () => {
        const type = elements.evalPasswordInput.type === 'password' ? 'text' : 'password';
        elements.evalPasswordInput.type = type;
        
        elements.toggleEvalPassword.innerHTML = type === 'password' 
            ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
    });

    // Send generated password straight to strength analyzer
    elements.evalApplyGenPwd.addEventListener('click', () => {
        if (state.generatedPassword) {
            elements.evalPasswordInput.value = state.generatedPassword;
            elements.evalPasswordInput.type = 'text'; // Make it visible
            elements.toggleEvalPassword.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
            runStrengthEvaluation();
            showToast('Applied generated password to evaluator.', 'success');
        }
    });

    function runStrengthEvaluation() {
        const password = elements.evalPasswordInput.value;
        const analysis = ShieldPassCrypto.calculateEntropy(password);

        // Update metrics labels
        elements.evalEntropyVal.textContent = Math.round(analysis.entropy);
        elements.evalPoolVal.textContent = analysis.poolSize;

        if (password.length === 0) {
            elements.evalCombosVal.textContent = '0';
        } else {
            const comboCount = Math.pow(analysis.poolSize, password.length);
            if (!isFinite(comboCount)) {
                elements.evalCombosVal.textContent = `~2^${Math.round(analysis.entropy)}`;
            } else {
                elements.evalCombosVal.textContent = comboCount.toExponential(2);
            }
        }

        elements.evalStrengthLabel.textContent = analysis.strength;
        elements.evalStrengthLabel.style.color = analysis.color;

        // Reset track styles
        elements.meterTracks.forEach(track => track.className = 'meter-track');

        if (password.length > 0) {
            if (analysis.strength === 'Weak') {
                elements.meterTracks[0].classList.add('active-weak');
            } else if (analysis.strength === 'Moderate') {
                elements.meterTracks[0].classList.add('active-medium');
                elements.meterTracks[1].classList.add('active-medium');
            } else if (analysis.strength === 'Strong') {
                elements.meterTracks[0].classList.add('active-strong');
                elements.meterTracks[1].classList.add('active-strong');
                elements.meterTracks[2].classList.add('active-strong');
            } else if (analysis.strength === 'Very Strong') {
                elements.meterTracks[0].classList.add('active-verystrong');
                elements.meterTracks[1].classList.add('active-verystrong');
                elements.meterTracks[2].classList.add('active-verystrong');
                elements.meterTracks[3].classList.add('active-verystrong');
            }
        }

        // Checklist checks
        toggleChecklist(elements.chkLower, analysis.flags?.lowercase);
        toggleChecklist(elements.chkUpper, analysis.flags?.uppercase);
        toggleChecklist(elements.chkDigits, analysis.flags?.digits);
        toggleChecklist(elements.chkSymbols, analysis.flags?.symbols);

        // Adversary cracking times calculations
        const times = ShieldPassCrackingSim.calculateCrackingTimes(password, analysis);
        updateAdversaryCards(times);
    }

    function toggleChecklist(el, isValid) {
        if (isValid) {
            el.classList.add('valid');
            el.querySelector('svg').innerHTML = `<polyline points="20 6 9 17 4 12"/>`;
        } else {
            el.classList.remove('valid');
            el.querySelector('svg').innerHTML = `<circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 16 14"/>`;
        }
    }

    function updateAdversaryCards(times) {
        const cards = elements.adversaryGridContainer.querySelectorAll('.adversary-card');
        times.forEach((time, index) => {
            const card = cards[index];
            if (card) {
                const timeEl = card.querySelector('.adversary-time');
                timeEl.textContent = time.displayTime;

                // Color highlights
                card.className = 'adversary-card'; 
                if (time.displayTime.includes('Instant') || time.timeInSeconds < 60) {
                    card.classList.add('fast-crack');
                } else if (time.timeInSeconds > 31536000 * 100) {
                    card.classList.add('slow-crack');
                }
            }
        });
    }

    /* ==========================================================================
       INTERACTIVE CRACKING ARENA SIMULATOR
       ========================================================================== */
    elements.simStartBtn.addEventListener('click', () => {
        let password = elements.evalPasswordInput.value;
        if (!password) {
            password = 'ShieldPass1@';
            elements.evalPasswordInput.value = password;
            runStrengthEvaluation();
            showToast('Simulating default password: "ShieldPass1@"', 'info');
        }

        if (state.activeSimulator) {
            state.activeSimulator.stop();
        }

        elements.simTerminal.querySelector('#sim-log-1').textContent = `[+] Initiated cracking vector at: ${new Date().toLocaleTimeString()}`;
        elements.simTerminal.querySelector('#sim-log-2').textContent = `[*] Search Space pool: ${elements.evalPoolVal.textContent} characters. Target length: ${password.length}`;
        elements.simTerminal.querySelector('#sim-log-2').className = 'terminal-line cyan';

        elements.simStartBtn.disabled = true;
        elements.simStopBtn.disabled = false;

        state.activeSimulator = ShieldPassCrackingSim.createSimulator(
            password,
            (progress) => {
                elements.simMatrixDisplay.textContent = progress.guess;
                elements.simGuesses.textContent = `Guesses: ${progress.totalGuesses.toLocaleString()}`;
                elements.simTime.textContent = `Time Elapsed: ${progress.timeElapsed}s`;
                elements.simPercent.textContent = `${progress.percent}%`;
                elements.simProgressFill.style.width = `${progress.percent}%`;

                if (Math.random() < 0.1) {
                    elements.simTerminal.querySelector('#sim-log-2').textContent = `[*] Cycling permutations... Keys parsed: ${progress.totalGuesses}`;
                }
            },
            (result) => {
                elements.simStartBtn.disabled = false;
                elements.simStopBtn.disabled = true;

                const doneLog = document.createElement('div');
                doneLog.className = 'terminal-line';
                doneLog.style.color = 'var(--neon-success)';
                doneLog.textContent = `[SUCCESS] Target fully cracked in ${result.timeElapsed}s. Total computations: ${result.totalGuesses.toLocaleString()} cycles.`;
                elements.simTerminal.appendChild(doneLog);
                elements.simTerminal.scrollTop = elements.simTerminal.scrollHeight;

                showToast('Cracking simulation completed!', 'success');
            }
        );

        state.activeSimulator.start();
    });

    elements.simStopBtn.addEventListener('click', () => {
        if (state.activeSimulator) {
            state.activeSimulator.stop();
            elements.simStartBtn.disabled = false;
            elements.simStopBtn.disabled = true;

            const abortLog = document.createElement('div');
            abortLog.className = 'terminal-line danger';
            abortLog.textContent = `[ABORT] Attack vectors terminated by operator.`;
            elements.simTerminal.appendChild(abortLog);
            elements.simTerminal.scrollTop = elements.simTerminal.scrollHeight;

            showToast('Cracking simulation stopped.', 'info');
        }
    });

    /* ==========================================================================
       HASH INTEGRITY & AVALANCHE VISUALIZER
       ========================================================================== */
    elements.hashInput1.addEventListener('input', runIntegrityChecks);
    elements.hashInput2.addEventListener('input', runIntegrityChecks);

    async function runIntegrityChecks() {
        const text1 = elements.hashInput1.value;
        const text2 = elements.hashInput2.value;

        const hash1 = await ShieldPassCrypto.sha256(text1);
        const hash2 = await ShieldPassCrypto.sha256(text2);

        elements.hashOutputText1.textContent = hash1;
        elements.hashOutputText2.textContent = hash2;

        renderHashCells(elements.hashVisual1, hash1, hash2, false);
        renderHashCells(elements.hashVisual2, hash2, hash1, true);

        // Compute matches
        let matches = 0;
        for (let i = 0; i < 64; i++) {
            if (hash1[i] === hash2[i]) matches++;
        }

        const diffFactor = Math.round(((64 - matches) / 64) * 100);
        elements.avalancheMatchCount.textContent = matches;
        elements.avalancheDiffFactor.textContent = `${diffFactor}%`;

        if (text1 === text2) {
            elements.avalancheRating.textContent = 'Synchronized (Matching Inputs)';
            elements.avalancheRating.style.color = 'var(--neon-success)';
        } else if (diffFactor > 85) {
            elements.avalancheRating.textContent = 'Maximum Avalanche (Ideal Integrity)';
            elements.avalancheRating.style.color = 'var(--neon-info)';
        } else if (diffFactor > 50) {
            elements.avalancheRating.textContent = 'Moderate Avalanche';
            elements.avalancheRating.style.color = 'var(--neon-warning)';
        } else {
            elements.avalancheRating.textContent = 'Weak Diffusion (Security Risk)';
            elements.avalancheRating.style.color = 'var(--neon-danger)';
        }
    }

    function renderHashCells(container, hash, comparisonHash, isSecondInput) {
        container.innerHTML = '';
        for (let i = 0; i < 64; i++) {
            const char = hash[i];
            const cell = document.createElement('div');
            cell.className = 'hash-cell';
            cell.textContent = char;

            const decValue = parseInt(char, 16);
            const hue = isSecondInput ? 280 : 185; 
            const alpha = 0.05 + (decValue / 15) * 0.35; 
            cell.style.backgroundColor = `hsla(${hue}, 100%, 50%, ${alpha})`;
            cell.style.borderColor = `hsla(${hue}, 100%, 50%, ${alpha * 1.5})`;

            if (char === comparisonHash[i]) {
                cell.classList.add('diff-match');
            } else if (isSecondInput && elements.hashInput1.value !== elements.hashInput2.value) {
                cell.classList.add('diff-highlight');
            }

            container.appendChild(cell);
        }
    }

    /* ==========================================================================
       ENCRYPTED CREDENTIALS VAULT MODULE
       ========================================================================== */
    function checkVaultInitialization() {
        const isSetup = ShieldPassVault.isSetup();
        if (!isSetup) {
            elements.vaultLoginForm.style.display = 'none';
            elements.vaultSetupForm.style.display = 'block';
        } else {
            elements.vaultLoginForm.style.display = 'block';
            elements.vaultSetupForm.style.display = 'none';
        }
    }

    // Setup Vault click
    elements.vaultSetupBtn.addEventListener('click', async () => {
        const pwd = elements.vaultSetupPwd.value;
        const confirm = elements.vaultSetupPwdConfirm.value;

        if (pwd.length < 8) {
            showToast('Master password must be at least 8 characters.', 'error');
            return;
        }
        if (pwd !== confirm) {
            showToast('Passwords do not match.', 'error');
            return;
        }

        try {
            await ShieldPassVault.setup(pwd);
            state.masterPassword = pwd;
            state.vaultUnlocked = true;
            
            showToast('Vault created and initialized successfully!', 'success');
            elements.vaultSetupPwd.value = '';
            elements.vaultSetupPwdConfirm.value = '';
            
            elements.vaultLockedState.style.display = 'none';
            elements.vaultUnlockedState.style.display = 'flex';
            
            renderVaultCards();
            updateDashboardStats();
        } catch (e) {
            showToast(e.message, 'error');
        }
    });

    // Unlock Vault click
    elements.vaultUnlockBtn.addEventListener('click', async () => {
        const pwd = elements.vaultUnlockPwd.value;
        if (!pwd) {
            showToast('Please enter password.', 'error');
            return;
        }

        const isSuccess = await ShieldPassVault.unlock(pwd);
        if (isSuccess) {
            state.masterPassword = pwd;
            state.vaultUnlocked = true;
            elements.vaultUnlockPwd.value = '';
            
            elements.vaultLockedState.style.display = 'none';
            elements.vaultUnlockedState.style.display = 'flex';
            
            showToast('Vault decrypted successfully.', 'success');
            renderVaultCards();
            updateDashboardStats();
        } else {
            showToast('Invalid Master Password.', 'error');
        }
    });

    // Lock Vault click
    elements.vaultLockBtn.addEventListener('click', () => {
        state.masterPassword = '';
        state.vaultUnlocked = false;
        elements.vaultLockedState.style.display = 'block';
        elements.vaultUnlockedState.style.display = 'none';
        
        showToast('Vault credentials locked.', 'info');
        updateDashboardStats();
    });

    // Load credentials cards list
    async function renderVaultCards() {
        if (!state.vaultUnlocked || !state.masterPassword) return;

        try {
            const cards = await ShieldPassVault.load(state.masterPassword);
            const query = elements.vaultSearchInput.value.toLowerCase();
            
            elements.vaultCardsContainer.innerHTML = '';

            const filtered = cards.filter(c => 
                c.siteName.toLowerCase().includes(query) || 
                c.username.toLowerCase().includes(query)
            );

            if (filtered.length === 0) {
                elements.vaultCardsContainer.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
                        No secure credential cards found matching the criteria.
                    </div>`;
                return;
            }

            filtered.forEach(card => {
                const element = document.createElement('div');
                element.className = 'vault-item-card';
                element.setAttribute('data-id', card.id);
                
                const createdDate = new Date(card.createdAt).toLocaleDateString();

                element.innerHTML = `
                    <div class="vault-item-header">
                        <span class="vault-item-site">${escapeHTML(card.siteName)}</span>
                        <span class="vault-item-date">Created ${createdDate}</span>
                    </div>
                    
                    <div class="vault-item-field">
                        <span class="vault-item-label">Username</span>
                        <div class="vault-item-value-row">
                            <span class="vault-item-value">${escapeHTML(card.username)}</span>
                            <button class="input-btn btn-copy-username" title="Copy Username" style="position: static; padding: 4px;">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            </button>
                        </div>
                    </div>
                    
                    <div class="vault-item-field">
                        <span class="vault-item-label">Password</span>
                        <div class="vault-item-value-row">
                            <span class="vault-item-value password-field" data-pwd="${escapeHTML(card.password)}">••••••••</span>
                            <div style="display: flex; gap: 4px;">
                                <button class="input-btn btn-reveal-password" title="Reveal Password" style="position: static; padding: 4px;">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                </button>
                                <button class="input-btn btn-copy-password" title="Copy Password" style="position: static; padding: 4px;">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="vault-item-actions">
                        <button class="btn btn-secondary btn-danger btn-delete-card" style="padding: 0.5rem 1rem; font-size: 0.8rem;">Delete Card</button>
                    </div>
                `;

                element.querySelector('.btn-copy-username').addEventListener('click', () => {
                    navigator.clipboard.writeText(card.username);
                    showToast('Username copied to clipboard', 'info');
                });

                element.querySelector('.btn-copy-password').addEventListener('click', () => {
                    navigator.clipboard.writeText(card.password);
                    showToast('Password copied to clipboard', 'success');
                });

                element.querySelector('.btn-reveal-password').addEventListener('click', (e) => {
                    const btn = e.currentTarget;
                    const pwdSpan = element.querySelector('.password-field');
                    const isMasked = pwdSpan.textContent === '••••••••';
                    
                    if (isMasked) {
                        pwdSpan.textContent = card.password;
                        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
                    } else {
                        pwdSpan.textContent = '••••••••';
                        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
                    }
                });

                element.querySelector('.btn-delete-card').addEventListener('click', async () => {
                    if (confirm(`Are you sure you want to delete credentials for ${card.siteName}?`)) {
                        await ShieldPassVault.deleteCredential(card.id, state.masterPassword);
                        showToast(`Deleted card for ${card.siteName}`, 'info');
                        renderVaultCards();
                        updateDashboardStats();
                    }
                });

                elements.vaultCardsContainer.appendChild(element);
            });
        } catch (e) {
            showToast(e.message, 'error');
        }
    }

    elements.vaultSearchInput.addEventListener('input', renderVaultCards);

    // Modal controls
    elements.openAddCardBtn.addEventListener('click', () => {
        elements.addCardModal.classList.add('active');
        elements.addSiteName.focus();
    });

    function closeAddModal() {
        elements.addCardModal.classList.remove('active');
        elements.addSiteName.value = '';
        elements.addUsername.value = '';
        elements.addPassword.value = '';
    }

    elements.closeAddCardModal.addEventListener('click', closeAddModal);
    elements.cancelAddCardBtn.addEventListener('click', closeAddModal);

    elements.toggleAddPassword.addEventListener('click', () => {
        const type = elements.addPassword.type === 'password' ? 'text' : 'password';
        elements.addPassword.type = type;
        elements.toggleAddPassword.innerHTML = type === 'password'
            ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
    });

    elements.addPasswordGeneratorBtn.addEventListener('click', () => {
        const randomPwd = ShieldPassCrypto.generateSecurePassword({ length: 16 });
        elements.addPassword.value = randomPwd;
        elements.addPassword.type = 'text'; 
        showToast('Generated strong password into field.', 'info');
    });

    elements.saveCardBtn.addEventListener('click', async () => {
        const site = elements.addSiteName.value;
        const user = elements.addUsername.value;
        const pwd = elements.addPassword.value;

        if (!site || !user || !pwd) {
            showToast('All fields are required.', 'error');
            return;
        }

        try {
            await ShieldPassVault.addCredential(site, user, pwd, state.masterPassword);
            showToast(`Saved secure card for ${site}`, 'success');
            closeAddModal();
            renderVaultCards();
            updateDashboardStats();
        } catch (e) {
            showToast(e.message, 'error');
        }
    });

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    /* ==========================================================================
       SMART SUGGESTION GENERATOR SYSTEM
       ========================================================================== */
    elements.genLengthSlider.addEventListener('input', () => {
        const preset = state.generatorPreset;
        if (preset === 'passphrase') {
            elements.genLengthVal.textContent = `${elements.genLengthSlider.value} words`;
        } else if (preset === 'crypto-key') {
            elements.genLengthVal.textContent = `${elements.genLengthSlider.value} hex digits`;
        } else {
            elements.genLengthVal.textContent = elements.genLengthSlider.value;
        }
        triggerGeneration();
    });

    elements.genPresetCards.forEach(card => {
        card.addEventListener('click', () => {
            elements.genPresetCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            
            const preset = card.getAttribute('data-preset');
            state.generatorPreset = preset;
            
            // Reconfigure bounds based on selection
            if (preset === 'passphrase') {
                elements.genLengthSlider.min = 3;
                elements.genLengthSlider.max = 8;
                elements.genLengthSlider.value = 4;
                elements.genLengthVal.textContent = '4 words';
                elements.genCheckboxesContainer.style.opacity = '0.3';
                elements.genCheckboxesContainer.style.pointerEvents = 'none';
            } else if (preset === 'crypto-key') {
                elements.genLengthSlider.min = 16;
                elements.genLengthSlider.max = 64;
                elements.genLengthSlider.value = 32;
                elements.genLengthVal.textContent = '32 hex digits';
                elements.genCheckboxesContainer.style.opacity = '0.3';
                elements.genCheckboxesContainer.style.pointerEvents = 'none';
            } else {
                elements.genLengthSlider.min = 8;
                elements.genLengthSlider.max = 64;
                elements.genLengthSlider.value = 16;
                elements.genLengthVal.textContent = '16';
                elements.genCheckboxesContainer.style.opacity = '1';
                elements.genCheckboxesContainer.style.pointerEvents = 'auto';
            }

            triggerGeneration();
        });
    });

    [elements.genOptLower, elements.genOptUpper, elements.genOptDigits, elements.genOptSymbols].forEach(cb => {
        cb.addEventListener('change', triggerGeneration);
    });

    elements.genSubmitBtn.addEventListener('click', triggerGeneration);

    elements.genCopyBtn.addEventListener('click', () => {
        const text = elements.genOutputInput.value;
        if (text) {
            navigator.clipboard.writeText(text);
            showToast('Copied generated password!', 'success');
        }
    });

    function triggerGeneration() {
        const length = parseInt(elements.genLengthSlider.value);
        let password = '';

        if (state.generatorPreset === 'crypto-key') {
            const chars = '0123456789abcdef';
            const array = new Uint8Array(length);
            crypto.getRandomValues(array);
            for (let i = 0; i < length; i++) {
                password += chars[array[i] % 16];
            }
        } else {
            password = ShieldPassCrypto.generateSecurePassword({
                length,
                includeLower: elements.genOptLower.checked,
                includeUpper: elements.genOptUpper.checked,
                includeDigits: elements.genOptDigits.checked,
                includeSymbols: elements.genOptSymbols.checked,
                preset: state.generatorPreset
            });
        }

        state.generatedPassword = password;
        elements.genOutputInput.value = password;

        // Visual analysis
        const evalScore = ShieldPassCrypto.calculateEntropy(password);
        elements.genEntropyVal.textContent = Math.round(evalScore.entropy);
        elements.genVerdictVal.textContent = evalScore.strength;
        elements.genVerdictVal.style.color = evalScore.color;
    }

    /* ==========================================================================
       GLOBAL INITIALIZATION & WIPER
       ========================================================================== */
    elements.globalResetBtn.addEventListener('click', () => {
        if (confirm('WARNING: This will completely wipe all saved credentials and reset your security vault. This action cannot be undone. Do you wish to proceed?')) {
            ShieldPassVault.reset();
            state.masterPassword = '';
            state.vaultUnlocked = false;
            showToast('All stored configurations and credentials wiped.', 'error');
            
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    });

    // Start App
    checkVaultInitialization();
    updateDashboardStats();
    runStrengthEvaluation();
});
