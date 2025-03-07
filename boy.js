const axios = require('axios');
const readline = require('readline');
const fs = require('fs').promises;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function getFirebaseToken() {
    try {
        // Prompt for credentials
        const email = await new Promise(resolve => {
            rl.question('Enter email: ', (answer) => resolve(answer));
        });

        const password = await new Promise(resolve => {
            rl.question('Enter password: ', (answer) => resolve(answer));
        });

        const url = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword';
        
        const params = {
            key: 'AIzaSyB0YXNLWl-mPWQNX-tvd7rp-HVNr_GhAmk'
        };

        const payload = {
            email: email,
            password: password,
            returnSecureToken: true,
            clientType: 'CLIENT_TYPE_ANDROID'
        };

        const headers = {
            'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 9; ASUS_Z01QD Build/PI)',
            'Connection': 'Keep-Alive',
            'Accept-Encoding': 'gzip',
            'Content-Type': 'application/json',
            'X-Android-Package': 'com.lumira_mobile',
            'X-Android-Cert': '1A1F179100AAF62649EAD01C6870FDE2510B1BC2',
            'Accept-Language': 'en-US',
            'X-Client-Version': 'Android/Fallback/X22003001/FirebaseCore-Android',
            'X-Firebase-GMPID': '1:599727959790:android:5c819be0c7e7e3057a4dff',
            'X-Firebase-Client': 'H4sIAAAAAAAAAKtWykhNLCpJSk0sKVayio7VUSpLLSrOzM9TslIyUqoFAFyivEQfAAAA'
        };

        const response = await axios.post(url, payload, { 
            params: params, 
            headers: headers 
        });

        const data = response.data;

        console.log('\nResponse Data:');
        console.log('Email:', data.email || 'N/A');
        console.log('IdToken:', data.idToken || 'N/A');

        // Save token to file
        await fs.writeFile('token.txt', `email:${data.email}\ntoken:${data.idToken}`);
        console.log('\nToken saved to token.txt');

    } catch (error) {
        console.error('Error occurred:', error.response?.data?.error?.message || error.message);
    } finally {
        rl.close();
    }
}

// Install required package first:
// npm install axios

getFirebaseToken();
