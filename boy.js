async function monitorUser AndMiningInfo(token, email, accounts, accountIndex) {
    let running = true;
    const monitoringDuration = 5000; // Durasi monitoring dalam milidetik (60 detik)
    const startTime = Date.now();

    process.on('SIGINT', () => {
        console.log(`\nStopping monitoring for ${email}...`);
        running = false;
        saveToFile(accounts);
    });

    while (running) {
        // Cek apakah waktu monitoring sudah habis
        if (Date.now() - startTime >= monitoringDuration) {
            console.log(`\nMonitoring for ${email} has stopped after 60 seconds.`);
            running = false;
            saveToFile(accounts);
            break;
        }

        try {
            const userResponse = await axios.get(
                'https://api.airdroptoken.com/user/user/',
                {
                    headers: {
                        ...headers,
                        'authorization': `Bearer ${token}`
                    }
                }
            );

            const miningResponse = await axios.get(
                'https://api.airdroptoken.com/miners/miner/',
                {
                    headers: {
                        ...headers,
                        'authorization': `Bearer ${token}`
                    }
                }
            );

            const userData = userResponse.data;
            const userDetails = userData.details || {};
            const miningData = miningResponse.data.object || {};

            accounts[accountIndex] = {
                ...accounts[accountIndex],
                miner_active: userDetails.miner_active ?? 'N/A',
                adt_balance: userDetails.adt_balance ?? 'N/A',
                max_miners: userDetails.max_miners ?? 'N/A',
                mining_info: {
                    active: miningData.active ?? 'N/A',
                    adt_earned: miningData.adt_earned ?? 'N/A',
                    mining_time_left: miningData.mining_time_left ?? 'N/A',
                    adt_per_hour: miningData.adt_per_hour ?? 'N/A'
                }
            };

            console.clear();
            console.log(`Information for ${email}:`);
            console.log(`Full Name: ${userData.full_name || 'N/A'}`);
            console.log(`Email: ${userData.email || 'N/A'}`);
            console.log(`Country: ${userData.country || 'N/A'}`);
            console.log(`Miner Active: ${userDetails.miner_active ?? 'N/A'}`);
            console.log(`ADT Balance: ${userDetails.adt_balance ?? 'N/A'}`);
            console.log(`Max Miners: ${userDetails.max_miners ?? 'N/A'}`);
            console.log(`Mining Active: ${miningData.active ?? 'N/A'}`);
            console.log(`ADT Earned: ${miningData.adt_earned ?? 'N/A'}`);
            console.log(`Mining Time Left: ${miningData.mining_time_left ?? 'N/A'} seconds`);
            console.log(`ADT Per Hour: ${miningData.adt_per_hour ?? 'N/A'}`);
            console.log('\nPress Ctrl+C to stop monitoring...');

            await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (error) {
            console.error(`Error monitoring for ${email}:`, error.message);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
                  }
