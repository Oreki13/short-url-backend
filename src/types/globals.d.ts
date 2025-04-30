// Deklarasi namespace global untuk TypeScript
declare global {
    var testSession: {
        cookies?: string;
        sharedToken?: string;
        sharedUserId?: string;
        sharedCsrfToken?: string;
        [key: string]: any;
    };
}

// Pastikan file ini diperlakukan sebagai modul
export { };