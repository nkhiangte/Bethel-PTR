// googleApi.ts
// This file handles all interactions with Google APIs (Auth and Drive).

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';
const DATA_FILE_NAME = 'bethel_kohhran_data.json';

let gapi: any = null;
let gsiClient: any = null;
let gapiClient: any = null;

let config = {
    apiKey: '',
    clientId: ''
};

interface GoogleUser {
    id: string;
    name: string;
    email: string;
}
let currentGoogleUser: GoogleUser | null = null;


// --- CONFIGURATION ---

export const saveConfig = (newConfig: { apiKey: string, clientId: string }) => {
    localStorage.setItem('google_api_key', newConfig.apiKey);
    localStorage.setItem('google_client_id', newConfig.clientId);
    config = newConfig;
};

export const getConfig = () => {
    if (!config.apiKey || !config.clientId) {
        config = {
            apiKey: localStorage.getItem('google_api_key') || '',
            clientId: localStorage.getItem('google_client_id') || ''
        };
    }
    return config;
};

// --- INITIALIZATION ---

export const initClient = (): Promise<void> => {
    getConfig();
    return new Promise((resolve, reject) => {
        gapi = (window as any).gapi;
        if (!gapi) return reject(new Error("gapi not loaded"));

        gapi.load('client', async () => {
            try {
                await gapi.client.init({
                    apiKey: config.apiKey,
                    discoveryDocs: [DISCOVERY_DOC],
                });

                gsiClient = (window as any).google.accounts.oauth2.initTokenClient({
                    client_id: config.clientId,
                    scope: SCOPES,
                    callback: (tokenResponse: any) => {
                        gapiClient = gapi.client; // Store the authenticated client
                    },
                });

                // Check for existing session
                const token = gapi.client.getToken();
                if (token) {
                    await fetchUserProfile();
                }
                
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    });
};

const fetchUserProfile = async () => {
     try {
        const res = await gapi.client.request({
            path: 'https://www.googleapis.com/oauth2/v3/userinfo'
        });
        const userProfile = res.result;
        currentGoogleUser = {
            id: userProfile.sub,
            name: userProfile.name,
            email: userProfile.email
        };
    } catch (e) {
        console.error("Could not fetch user profile", e);
        currentGoogleUser = null;
    }
}


// --- AUTHENTICATION ---
export const signIn = (onSuccess: (user: GoogleUser) => void): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!gsiClient) return reject("GSI client not initialized.");

        gsiClient.callback = async (tokenResponse: any) => {
            if (tokenResponse.error) {
                return reject(tokenResponse.error);
            }
            try {
                gapiClient = gapi.client;
                await fetchUserProfile();
                if (currentGoogleUser) {
                    onSuccess(currentGoogleUser);
                    resolve();
                } else {
                    reject("Failed to retrieve user profile after login.");
                }
            } catch (e) {
                reject(e);
            }
        };

        if (gapi.client.getToken() === null) {
            gsiClient.requestAccessToken({ prompt: 'consent' });
        } else {
            gsiClient.requestAccessToken({ prompt: '' });
        }
    });
};


export const signOut = () => {
    const token = gapi.client.getToken();
    if (token) {
        (window as any).google.accounts.oauth2.revoke(token.access_token, () => {});
        gapi.client.setToken(null);
    }
    currentGoogleUser = null;
};

export const getCurrentGoogleUser = (): GoogleUser | null => {
    return currentGoogleUser;
};


// --- DRIVE FILE OPERATIONS ---

export const findOrCreateFile = async (): Promise<string> => {
    // Search for the file
    const response = await gapi.client.drive.files.list({
        q: `name='${DATA_FILE_NAME}'`,
        spaces: 'appDataFolder',
        fields: 'files(id, name)',
    });

    if (response.result.files.length > 0) {
        return response.result.files[0].id;
    }

    // If not found, create it
    const createResponse = await gapi.client.drive.files.create({
        resource: {
            name: DATA_FILE_NAME,
            parents: ['appDataFolder'],
        },
        fields: 'id',
    });

    return createResponse.result.id;
};


export const getFileContent = async (fileId: string): Promise<string> => {
    const response = await gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media',
    });
    return response.body;
};


export const updateFileContent = async (fileId: string, content: string): Promise<void> => {
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const contentType = 'application/json';

    const metadata = {
        'mimeType': contentType
    };

    var multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: ' + contentType + '\r\n\r\n' +
        content +
        close_delim;

    await gapi.client.request({
        path: `/upload/drive/v3/files/${fileId}`,
        method: 'PATCH',
        params: {
            uploadType: 'multipart'
        },
        headers: {
            'Content-Type': 'multipart/related; boundary="' + boundary + '"'
        },
        body: multipartRequestBody
    });
};
