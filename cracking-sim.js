/**
 * ShieldPassCrackingSim - Password cracking simulator and analysis
 */

const ShieldPassCrackingSim = {
    // Top 100 most common passwords for dictionary checking
    commonPasswords: [
        "123456", "password", "123456789", "12345678", "12345", "1234567", "qwerty", "1234567890",
        "admin", "1234567890", "1234", "password123", "111111", "qwertyuiop", "123123", "123456789",
        "football", "iloveyou", "sunshine", "princess", "welcome", "charlie", "monkey", "shadow",
        "solo123", "killer", "letmein", "joshua", "caterpillar", "trustnoone", "dragon", "hunter2",
        "123456789", "ninja", "superman", "computer", "keyboard", "security", "pass123", "secret",
        "freedom", "justice", "database", "oracle", "pentester", "hacker", "anonymous", "root",
        "system", "network", "firewall", "cybersecurity", "shieldpass", "gemini", "antigravity",
        "google", "microsoft", "apple", "linux", "windows", "android", "iphone", "chrome",
        "facebook", "instagram", "twitter", "linkedin", "reddit", "youtube", "netflix", "spotify",
        "password!", "p@ssword", "p@ssw0rd", "P@ssw0rd1!", "Admin123", "admin123", "root123",
        "login", "signin", "signup", "access", "control", "default", "master", "wizard",
        "morgan", "bailey", "cooper", "sydney", "taylor", "jordan", "harley", "alexis", "cameron"
    ],

    // Guess rates (attempts per second) for various adversaries
    adversaries: [
        {
            id: 'laptop',
            name: 'Standard Laptop',
            rate: 1e5, // 100,000 / sec
            icon: '💻',
            desc: 'Average consumer CPU running brute-force script.'
        },
        {
            id: 'gpu_rig',
            name: '8x RTX 4090 GPU Rig',
            rate: 1e10, // 10 Billion / sec
            icon: '🎛️',
            desc: 'Custom-built cracking rig utilizing parallel GPU hash power.'
        },
        {
            id: 'supercomputer',
            name: 'Government Supercomputer',
            rate: 1e14, // 100 Trillion / sec
            icon: '🏢',
            desc: 'Massive high-performance computing cluster.'
        },
        {
            id: 'quantum',
            name: 'Quantum Decryption Cluster',
            rate: 1e18, // 1 Exahash / sec
            icon: '⚛️',
            desc: 'Next-gen nation-state decryption nodes exploiting search space.'
        }
    ],

    // Check if the password matches a common dictionary item
    checkDictionary(password) {
        const lower = password.toLowerCase();
        return this.commonPasswords.includes(lower);
    },

    // Format time in seconds to a human-readable duration
    formatTime(seconds) {
        if (seconds === 0) return 'Instantly';
        if (seconds < 1e-3) return 'Microseconds';
        if (seconds < 1) return 'Less than a second';

        const units = [
            { name: 'year', secs: 31536000 },
            { name: 'day', secs: 86400 },
            { name: 'hour', secs: 3600 },
            { name: 'minute', secs: 60 },
            { name: 'second', secs: 1 }
        ];

        // For astronomical numbers
        if (seconds >= units[0].secs * 1e9) {
            const billionsOfYears = seconds / (units[0].secs * 1e9);
            return `${this.formatScientific(billionsOfYears)} Billion Years`;
        }
        if (seconds >= units[0].secs * 1e6) {
            const millionsOfYears = seconds / (units[0].secs * 1e6);
            return `${this.formatScientific(millionsOfYears)} Million Years`;
        }

        let remaining = seconds;
        const parts = [];

        for (const unit of units) {
            if (remaining >= unit.secs) {
                const value = Math.floor(remaining / unit.secs);
                remaining %= unit.secs;
                parts.push(`${value} ${unit.name}${value > 1 ? 's' : ''}`);
                if (parts.length >= 2) break; // Return at most 2 units for brevity
            }
        }

        return parts.join(', ');
    },

    formatScientific(num) {
        if (num < 1000) return num.toFixed(1);
        if (num < 1e6) return Math.round(num).toLocaleString();
        return num.toExponential(2);
    },

    // Calculate time to crack for a given password across all adversaries
    calculateCrackingTimes(password, entropyDetails) {
        const isCommon = this.checkDictionary(password);
        
        // Key space calculation: R^L
        const R = entropyDetails.poolSize;
        const L = password.length;
        const keyspace = R > 0 ? Math.pow(R, L) : 0;
        
        // Average combinations to try is Keyspace / 2
        const averageGuesses = keyspace / 2;

        return this.adversaries.map(adv => {
            let timeInSeconds = 0;
            let displayTime = '';
            
            if (isCommon) {
                displayTime = 'Instantly (Common Dictionary Match)';
            } else if (password.length === 0) {
                displayTime = 'N/A';
            } else {
                // If keyspace is Infinity (js float overflow), base it on entropy: 2^entropy
                if (!isFinite(keyspace)) {
                    // time = 2^(entropy - 1) / rate
                    const exponent = entropyDetails.entropy - 1;
                    // use log rules: 2^exponent / rate = 10^(exponent * log10(2) - log10(rate))
                    const log10Time = exponent * Math.log10(2) - Math.log10(adv.rate);
                    if (log10Time > 300) {
                        timeInSeconds = Infinity;
                        displayTime = 'Trillions of Trillions of Years';
                    } else {
                        timeInSeconds = Math.pow(10, log10Time);
                        displayTime = this.formatTime(timeInSeconds);
                    }
                } else {
                    timeInSeconds = averageGuesses / adv.rate;
                    displayTime = this.formatTime(timeInSeconds);
                }
            }

            return {
                ...adv,
                timeInSeconds,
                displayTime,
                isCommon
            };
        });
    },

    // Interactive Brute Force Simulator class
    createSimulator(targetPassword, onProgress, onComplete) {
        let isRunning = false;
        let animationFrameId = null;
        const startTime = Date.now();
        const length = targetPassword.length;
        
        // Determine charset pool from targetPassword
        const lower = /[a-z]/.test(targetPassword);
        const upper = /[A-Z]/.test(targetPassword);
        const digits = /[0-9]/.test(targetPassword);
        const symbols = /[^a-zA-Z0-9]/.test(targetPassword);
        
        let pool = '';
        if (lower) pool += 'abcdefghijklmnopqrstuvwxyz';
        if (upper) pool += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (digits) pool += '0123456789';
        if (symbols) pool += '!@#$%^&*()_+-=[]{}|;:,.<>?';
        if (pool.length === 0) pool = 'abcdefghijklmnopqrstuvwxyz0123456789';

        let currentGuess = Array(length).fill(' ');
        let lockedIndices = new Set();
        let totalGuesses = 0;

        function step() {
            if (!isRunning) return;

            // Simulate parallel worker guessing
            // We lock characters from left to right simulating a hybrid smart brute-force search
            const guessesPerFrame = 50; 
            totalGuesses += guessesPerFrame;

            // Generate temporary characters for visual matrix effect
            for (let i = 0; i < length; i++) {
                if (!lockedIndices.has(i)) {
                    currentGuess[i] = pool.charAt(Math.floor(Math.random() * pool.length));
                }
            }

            // Probability of locking in a character increases with time, simulating resolving
            // In a real hack, characters resolve one by one or via mask matching.
            // Let's unlock a character index every ~30 frames (0.5s) to make it look cool
            const timeElapsed = Date.now() - startTime;
            const targetLocks = Math.min(length, Math.floor(timeElapsed / 400));
            
            for (let i = 0; i < targetLocks; i++) {
                if (!lockedIndices.has(i)) {
                    lockedIndices.add(i);
                    currentGuess[i] = targetPassword[i];
                }
            }

            // Check if fully cracked
            if (lockedIndices.size === length) {
                currentGuess = targetPassword.split('');
                onProgress({
                    guess: currentGuess.join(''),
                    totalGuesses,
                    timeElapsed: ((Date.now() - startTime) / 1000).toFixed(2),
                    percent: 100
                });
                isRunning = false;
                onComplete({
                    totalGuesses,
                    timeElapsed: ((Date.now() - startTime) / 1000).toFixed(2)
                });
                return;
            }

            const percent = Math.round((lockedIndices.size / length) * 100);
            onProgress({
                guess: currentGuess.join(''),
                totalGuesses,
                timeElapsed: ((Date.now() - startTime) / 1000).toFixed(2),
                percent
            });

            animationFrameId = requestAnimationFrame(step);
        }

        return {
            start() {
                if (isRunning) return;
                isRunning = true;
                startTime = Date.now();
                step();
            },
            stop() {
                isRunning = false;
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                }
            }
        };
    }
};
