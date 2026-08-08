/**
 * ShieldPassVault - Encrypted local storage vault manager
 * Handles PBKDF2/AES-GCM encryption of the vault payload
 */

const ShieldPassVault = {
    VERIFICATION_KEY: 'shieldpass_vault_verification',
    DATA_KEY: 'shieldpass_vault_data',
    VERIFICATION_PLAINTEXT: 'SHIELD_PASS_VAULT_DECRYPT_OK_2026',

    // Checks if the vault has been set up with a master password
    isSetup() {
        return localStorage.getItem(this.VERIFICATION_KEY) !== null;
    },

    // Setup a new vault with a master password
    async setup(masterPassword) {
        if (this.isSetup()) {
            throw new Error('Vault is already initialized.');
        }

        // Encrypt verification token
        const verificationPayload = await ShieldPassCrypto.encryptData(
            this.VERIFICATION_PLAINTEXT,
            masterPassword
        );
        localStorage.setItem(this.VERIFICATION_KEY, verificationPayload);

        // Save empty credentials list
        await this.save([], masterPassword);
    },

    // Verify master password and unlock vault
    async unlock(masterPassword) {
        if (!this.isSetup()) {
            throw new Error('Vault has not been set up yet.');
        }

        const verificationPayload = localStorage.getItem(this.VERIFICATION_KEY);
        try {
            const decrypted = await ShieldPassCrypto.decryptData(verificationPayload, masterPassword);
            return decrypted === this.VERIFICATION_PLAINTEXT;
        } catch (e) {
            return false;
        }
    },

    // Load credentials array from encrypted storage
    async load(masterPassword) {
        const encryptedData = localStorage.getItem(this.DATA_KEY);
        if (!encryptedData) return [];

        try {
            const decryptedStr = await ShieldPassCrypto.decryptData(encryptedData, masterPassword);
            return JSON.parse(decryptedStr);
        } catch (e) {
            console.error('Failed to load vault data:', e);
            throw new Error('Failed to decrypt vault data.');
        }
    },

    // Encrypt and save credentials array to storage
    async save(credentials, masterPassword) {
        const plaintext = JSON.stringify(credentials);
        const encryptedPayload = await ShieldPassCrypto.encryptData(plaintext, masterPassword);
        localStorage.setItem(this.DATA_KEY, encryptedPayload);
    },

    // Add a new account credentials card
    async addCredential(siteName, username, password, masterPassword) {
        const credentials = await this.load(masterPassword);
        const newCard = {
            id: 'cred_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now(),
            siteName,
            username,
            password,
            createdAt: new Date().toISOString()
        };
        credentials.push(newCard);
        await this.save(credentials, masterPassword);
        return newCard;
    },

    // Delete a credentials card by ID
    async deleteCredential(id, masterPassword) {
        let credentials = await this.load(masterPassword);
        credentials = credentials.filter(c => c.id !== id);
        await this.save(credentials, masterPassword);
    },

    // Reset vault completely (deletes all data)
    reset() {
        localStorage.removeItem(this.VERIFICATION_KEY);
        localStorage.removeItem(this.DATA_KEY);
    }
};
