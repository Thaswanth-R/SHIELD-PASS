/**
 * ShieldPassCrypto - Cryptographic and mathematical utilities
 * Implements entropy evaluation, SHA-256, and AES-GCM vault encryption
 */

const ShieldPassCrypto = {
    // Determine the character pool size and calculate Shannon entropy
    calculateEntropy(password) {
        if (!password) return { entropy: 0, poolSize: 0, strength: 'None', color: 'var(--gray-500)' };

        let poolSize = 0;
        const poolFlags = {
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            digits: /[0-9]/.test(password),
            symbols: /[^a-zA-Z0-9]/.test(password)
        };

        if (poolFlags.lowercase) poolSize += 26;
        if (poolFlags.uppercase) poolSize += 26;
        if (poolFlags.digits) poolSize += 10;
        if (poolFlags.symbols) poolSize += 33; // Standard symbols

        const length = password.length;
        // Entropy calculation: E = L * log2(R)
        const entropy = poolSize > 0 ? length * Math.log2(poolSize) : 0;

        let strength = 'Weak';
        let color = 'var(--neon-danger)'; // Red/Pink

        if (entropy >= 80) {
            strength = 'Very Strong';
            color = 'var(--neon-success)'; // Neon Green
        } else if (entropy >= 60) {
            strength = 'Strong';
            color = 'var(--neon-info)'; // Cyan
        } else if (entropy >= 35) {
            strength = 'Moderate';
            color = 'var(--neon-warning)'; // Yellow/Orange
        }

        return {
            entropy: Math.round(entropy * 100) / 100,
            poolSize,
            strength,
            color,
            flags: poolFlags
        };
    },

    // Browser-native SHA-256 hash generator
    async sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    },

    // Convert ArrayBuffer to Base64 String
    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    },

    // Convert Base64 String to ArrayBuffer
    base64ToArrayBuffer(base64) {
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    },

    // Derive a CryptoKey from master password using PBKDF2
    async deriveKey(masterPassword, salt) {
        const encoder = new TextEncoder();
        const baseKey = await crypto.subtle.importKey(
            'raw',
            encoder.encode(masterPassword),
            'PBKDF2',
            false,
            ['deriveKey']
        );

        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            baseKey,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    },

    // Encrypt data using PBKDF2 derived key and AES-GCM
    async encryptData(plaintext, masterPassword) {
        try {
            const encoder = new TextEncoder();
            const salt = crypto.getRandomValues(new Uint8Array(16));
            const iv = crypto.getRandomValues(new Uint8Array(12));

            const key = await this.deriveKey(masterPassword, salt);
            const ciphertextBuffer = await crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                key,
                encoder.encode(plaintext)
            );

            return JSON.stringify({
                ciphertext: this.arrayBufferToBase64(ciphertextBuffer),
                salt: this.arrayBufferToBase64(salt),
                iv: this.arrayBufferToBase64(iv)
            });
        } catch (e) {
            console.error('Encryption failed:', e);
            throw new Error('Encryption failed. Please check master password parameters.');
        }
    },

    // Decrypt data using PBKDF2 derived key and AES-GCM
    async decryptData(encryptedJsonStr, masterPassword) {
        try {
            const { ciphertext, salt, iv } = JSON.parse(encryptedJsonStr);
            const ciphertextBuffer = this.base64ToArrayBuffer(ciphertext);
            const saltBuffer = this.base64ToArrayBuffer(salt);
            const ivBuffer = this.base64ToArrayBuffer(iv);

            const key = await this.deriveKey(masterPassword, new Uint8Array(saltBuffer));
            const decryptedBuffer = await crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: new Uint8Array(ivBuffer)
                },
                key,
                ciphertextBuffer
            );

            return new TextDecoder().decode(decryptedBuffer);
        } catch (e) {
            console.error('Decryption failed:', e);
            throw new Error('Decryption failed. Incorrect master password.');
        }
    },

    // Generate a secure password with selected parameters
    generateSecurePassword(options = {}) {
        const {
            length = 16,
            includeLower = true,
            includeUpper = true,
            includeDigits = true,
            includeSymbols = true,
            preset = 'alphanumeric' // 'alphanumeric', 'passphrase', 'pronounceable'
        } = options;

        if (preset === 'passphrase') {
            // Generates a memorable multi-word passphrase
            const wordList = [
                'quantum', 'nebula', 'cyber', 'matrix', 'fortress', 'sentinel', 'beacon', 'bastion',
                'glitch', 'bypass', 'entropy', 'vertex', 'nexus', 'shield', 'cipher', 'vector',
                'binary', 'static', 'dynamic', 'plasma', 'cosmic', 'aurora', 'silicon', 'shadow',
                'cascade', 'monolith', 'anomaly', 'phantom', 'goliath', 'horizon', 'solitude', 'vortex',
                'circuit', 'firewall', 'gateway', 'terminal', 'pixel', 'vessel', 'haven', 'sanctuary'
            ];
            const words = [];
            for (let i = 0; i < 4; i++) {
                const index = Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] % wordList.length);
                words.push(wordList[index]);
            }
            // Add a random symbol and digit between words or at end
            const separator = '-';
            const randomDigit = Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] % 10);
            return words.join(separator) + randomDigit;
        }

        if (preset === 'pronounceable') {
            // Alternating consonants and vowels for readable passwords
            const cons = 'bcdfghjklmnpqrstvwxyz';
            const vows = 'aeiou';
            let password = '';
            for (let i = 0; i < length; i++) {
                const isConsonant = i % 2 === 0;
                const set = isConsonant ? cons : vows;
                let char = set.charAt(crypto.getRandomValues(new Uint32Array(1))[0] % set.length);
                if (i === 0 && includeUpper) char = char.toUpperCase();
                password += char;
            }
            if (includeDigits) {
                password += Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] % 10);
            }
            if (includeSymbols) {
                const syms = '!@#$%&*';
                password += syms.charAt(crypto.getRandomValues(new Uint32Array(1))[0] % syms.length);
            }
            return password;
        }

        // Standard alphanumeric + special password generation
        const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
        const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const digitChars = '0123456789';
        const symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

        let charPool = '';
        let guaranteedChars = [];

        if (includeLower) {
            charPool += lowerChars;
            guaranteedChars.push(lowerChars.charAt(crypto.getRandomValues(new Uint32Array(1))[0] % lowerChars.length));
        }
        if (includeUpper) {
            charPool += upperChars;
            guaranteedChars.push(upperChars.charAt(crypto.getRandomValues(new Uint32Array(1))[0] % upperChars.length));
        }
        if (includeDigits) {
            charPool += digitChars;
            guaranteedChars.push(digitChars.charAt(crypto.getRandomValues(new Uint32Array(1))[0] % digitChars.length));
        }
        if (includeSymbols) {
            charPool += symbolChars;
            guaranteedChars.push(symbolChars.charAt(crypto.getRandomValues(new Uint32Array(1))[0] % symbolChars.length));
        }

        if (charPool.length === 0) {
            charPool = lowerChars + digitChars;
        }

        let password = '';
        // Add guaranteed chars first
        password += guaranteedChars.join('');

        // Fill up remaining length
        const remainingLength = length - password.length;
        const randomValues = new Uint32Array(remainingLength);
        crypto.getRandomValues(randomValues);

        for (let i = 0; i < remainingLength; i++) {
            password += charPool.charAt(randomValues[i] % charPool.length);
        }

        // Shuffle password characters
        const arr = password.split('');
        for (let i = arr.length - 1; i > 0; i--) {
            const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
            const temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }

        return arr.join('');
    }
};
