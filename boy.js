const axios = require('axios');
const fs = require('fs');
const readline = require('readline');

const headers = {
    'user-agent': 'Dart/3.6 (dart:io)',
    'accept-encoding': 'gzip',
    'host': 'api.airdroptoken.com',
    'accept': '*/*',
    'content-type': 'application/json'
};

const firebaseHeaders = {
    'Content-Type': 'application/json',
    'X-Android-Package': 'com.lumira_mobile',
    'X-Android-Cert': '1A1F179100AAF62649EAD01C6870FDE2510B1BC2',
    'Accept-Language': 'en-US',
    'X-Client-Version': 'Android/Fallback/X22003001/FirebaseCore-Android',
    'X-Firebase-GMPID': '1:599727959790:android:5c819be0c7e7e3057a4dff',
    'X-Firebase-Client': 'H4sIAAAAAAAAAKtWykhNLCpJSk0sKVayio7VUSpLLSrOzM9TslIyUqoFAFyivEQfAAAA',
    'User -Agent': 'Dalvik/2.1.0 (Linux; U; Android 7.1.2; ASUS_Z01QD Build/N2G48H)',
    'Host': 'www.googleapis.com',
    'Connection': 'Keep-Alive',
    'Accept-Encoding': 'gzip'
};

function generateRandomString(length) {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
}

function generateRandomBirthday() {
    const start = new Date(1980, 0, 1);
    const end = new Date(2005, 11, 31);
    const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return randomDate.toISOString().split('T')[0]; // Format YYYY-MM-DD
}

function generateAccountData() {
    const randomStr = generateRandomString(8);
    const referralCode = fs.readFileSync('code.txt', 'utf8').trim();
    return {
        full_name: `user${randomStr}`,
        username: `user${randomStr}`,
        email: `user${randomStr}@gmail.com`,
        password: `Pass${randomStr}123`,
        phone: `+628${Math.floor(100000000 + Math.random() * 900000000)}`,
        referral_code: referralCode,
        country: 'ID',
        birthday: generateRandomBirthday()
    };
}

async function checkEmail(email) {
    try {
        const response = await axios.get(`https://api.airdroptoken.com/user/email-in-use?email=${encodeURIComponent(email)}`, { headers });
        return !response.data.in_use;
    } catch (error) {
        console.error('Error checking email:', error.message);
        return false;
    }
}

async function checkUsername(username) {
    try {
        const response = await axios.get(`https://api.airdroptoken.com/user/username-in-use?username=${username}`, { headers });
        return !response.data.in_use;
    } catch (error) {
        console.error('Error checking username:', error.message);
        return false;
    }
}

async function login(email, password) {
    try {
        const response = await axios.post('https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=AIzaSyB0YXNLWl-mPWQNX-tvd7rp-HVNr_GhAmk', {
            email,
            password,
            returnSecureToken: true,
            clientType: 'CLIENT_TYPE_ANDROID'
        }, { headers: firebaseHeaders });

        return response.data.idToken;
    } catch (error) {
        console.error('Login failed:', error.response?.data?.error?.message || error.message);
        return null;
    }
}

async function startMining(token) {
    try {
        await axios.put('https://api.airdroptoken.com/miners/miner', {}, {
            headers: { ...headers, 'authorization': `Bearer ${token}` }
        });
        await axios.put('https://api.airdroptoken.com/user/ads', 'ads_enabled=false', {
            headers: { ...headers, 'authorization': `Bearer ${token}`, 'content-type': 'application/x-www-form-urlencoded; charset=utf-8' }
        });
        return true;
    } catch (error) {
        console.error('Error starting mining:', error.message);
        return false;
    }
}

async function monitorUserAndMiningInfo(token, email, accounts, accountIndex) {
    let running = true;

    process.on('SIGINT', () => {
        console.log(`\nStopping monitoring for ${email}...`);
        running = false;
        saveToFile(accounts);
    });

    while (running) {
        try {
            const userResponse = await axios.get('https://api.airdroptoken.com/user/user/', {
                headers: { ...headers, 'authorization': `Bearer ${token}` }
            });
            const miningResponse = await axios.get('https://api.airdroptoken.com/miners/miner/', {
                headers: { ...headers, 'authorization': `Bearer ${token}` }
            });

            const userData = userResponse.data;
            const miningData = miningResponse.data.object || {};

            accounts[accountIndex] = {
                ...accounts[accountIndex],
                miner_active: userData.details?.miner_active ?? 'N/A',
                adt_balance: userData.details?.adt_balance ?? 'N/A',
                mining_info: {
                    active: miningData.active ?? 'N/A',
                    adt_earned: miningData.adt_earned ?? 'N/A',
                    mining_time_left: miningData.mining_time_left ?? 'N/A',
                    adt_per_hour: miningData.adt_per_hour ?? 'N/A'
                }
            };

            console.clear();
            console.log(`Monitoring ${email}: Miner Active: ${accounts[accountIndex].miner_active}, ADT Balance: ${accounts[accountIndex].adt_balance}`);
            console.log(`Mining Active: ${miningData.active}, ADT Earned: ${miningData.adt_earned}`);
            console.log(`Press Ctrl+C to stop...`);

            await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (error) {
            console.error(`Error monitoring ${email}:`, error.message);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

async function registerAccount(accountData) {
    try {
        const [emailAvailable, usernameAvailable] = await Promise.all([
            checkEmail(accountData.email),
            checkUsername(accountData.username)
        ]);

        if (!emailAvailable || !usernameAvailable) {
            throw new Error('Email or username already in use');
        }

        const response = await axios.post('https://api.airdroptoken.com/user/register', accountData, {
            headers: { ...headers, 'authorization': 'Bearer null' }
        });

        return { success: true, data: accountData, response: response.data };
    } catch (error) {
        return { success: false, error: error.message, data: accountData };
    }
}

function saveToFile(accounts) {
    fs.writeFileSync('accounts.json', JSON.stringify(accounts, null, 2));
}

async function main() {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    rl.question('Enter the number of accounts to create: ', async (answer) => {
        const count = parseInt(answer);
        if (isNaN(count) || count <= 0) {
            console.log('Enter a valid number!');
            rl.close();
            return;
        }

        const accounts = [];
        console.log(`Creating ${count} accounts...`);

        for (let i = 0; i < count; i++) {
            const accountData = generateAccountData();
            const result = await registerAccount(accountData);

            if (result.success) {
                console.log(`Account created: ${accountData.email}`);
                
                const token = await login(accountData.email, accountData.password);
                if (token) {
                    const miningStarted = await startMining(token);
                    console.log(`Mining ${miningStarted ? 'started' : 'failed'} for ${accountData.email}`);
                    
                    accounts.push({ ...accountData, token, mining_status: miningStarted ? 'active' : 'inactive', created_at: new Date().toISOString() });

                    if (miningStarted) {
                        await monitorUser AndMiningInfo(token, accountData.email, accounts, accounts.length - 1);
                    }
                } else {
                    console.log(`Login failed for ${accountData.email}`);
                    accounts.push({ ...accountData, token: null, mining_status: 'inactive', created_at: new Date().toISOString() });
                }
            } else {
                console.log(`Failed to create account: ${result.error}`);
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        saveToFile(accounts);
        console.log(`Done! Account data saved to accounts.json`);
        rl.close();
    });
}

main().catch(console.error);
