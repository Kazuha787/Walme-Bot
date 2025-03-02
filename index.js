const fs = require('fs').promises;

const axios = require('axios');

const SocksProxyAgent = require('socks-proxy-agent').SocksProxyAgent;

const HttpProxyAgent = require('http-proxy-agent').HttpProxyAgent;

const HttpsProxyAgent = require('https-proxy-agent').HttpsProxyAgent;



let chalk;

(async () => {

    chalk = (await import('chalk')).default;

    runBot();

})();



const BASE_URL = 'https://api.walme.io/waitlist/tasks';

const PROFILE_URL = 'https://api.walme.io/user/profile';

const COMPLETED_TASKS_FILE = 'completed_tasks.json';

const PROXIES_FILE = 'proxies.txt';



async function getAccessTokens() {

    try {

        const tokenData = await fs.readFile('tokens.txt', 'utf8');

        const tokens = tokenData.split('\n')

            .map(token => token.trim())

            .filter(token => token.length > 0);

        

        if (tokens.length === 0) {

            throw new Error('No tokens found in tokens.txt');

        }

        return tokens;

    } catch (error) {

        console.error(chalk.red.bold(`[ERROR] Failed to read tokens from tokens.txt: ${error.message}`));

        throw error;

    }

}



async function getProxies() {

    try {

        const proxyData = await fs.readFile(PROXIES_FILE, 'utf8');

        const proxies = proxyData.split('\n')

            .map(proxy => proxy.trim())

            .filter(proxy => proxy.length > 0);

        

        if (proxies.length === 0) {

            console.log(chalk.yellow(`[WARNING] No proxies found in ${PROXIES_FILE}. Running without proxies.`));

            return [];

        }

        

        console.log(chalk.white(`🌐 [INFO] Loaded ${proxies.length} proxies from ${PROXIES_FILE}`));

        return proxies;

    } catch (error) {

        console.error(chalk.yellow(`[WARNING] Failed to read proxies from ${PROXIES_FILE}: ${error.message}. Running without proxies.`));

        return [];

    }

}



function createProxyAgent(proxyString) {

    try {

        let protocol, host, port, auth;

        

        if (proxyString.includes('://')) {

            const url = new URL(proxyString);

            protocol = url.protocol.replace(':', '');

            host = url.hostname;

            port = url.port;

            auth = url.username && url.password ? `${url.username}:${url.password}` : null;

        } 

        else {

            const parts = proxyString.split(':');

            if (parts.length >= 2) {

                if (parts.length === 2) {

                    

                    [host, port] = parts;

                    protocol = 'http';

                } else if (parts.length === 4) {

                    

                    [host, port, ...auth] = parts;

                    auth = auth.join(':');

                    protocol = 'http'; 

                } else if (proxyString.includes('@')) {

                    const [credentials, server] = proxyString.split('@');

                    auth = credentials;

                    [host, port] = server.split(':');

                    protocol = 'http'; 

                }

            }

        }

        

        if (!host || !port) {

            throw new Error(`Invalid proxy format: ${proxyString}`);

        }

        

        let proxyType = protocol?.toLowerCase() || 'http';

        

        if (proxyType.startsWith('socks')) {

            const socksOptions = {

                hostname: host,

                port: parseInt(port)

            };

            

            if (auth) {

                const [username, password] = auth.split(':');

                socksOptions.username = username;

                socksOptions.password = password;

            }

            

            const socksUrl = `socks${proxyType.endsWith('5') ? '5' : '4'}://${auth ? auth + '@' : ''}${host}:${port}`;

            return new SocksProxyAgent(socksUrl);

        } 

        else {

            const httpProxyUrl = `http://${auth ? auth + '@' : ''}${host}:${port}`;

            return {

                http: new HttpProxyAgent(httpProxyUrl),

                https: new HttpsProxyAgent(httpProxyUrl)

            };

        }

    } catch (error) {

        console.error(chalk.red.bold(`[ERROR] Failed to create proxy agent: ${error.message}`));

        return null;

    }

}



async function getUserProfile(token, proxyAgent) {

    try {

        const config = {

            headers: {

                'Authorization': `Bearer ${token}`,

                'Accept': 'application/json'

            }

        };

        

        if (proxyAgent) {

            if (proxyAgent.http && proxyAgent.https) {

                config.httpAgent = proxyAgent.http;

                config.httpsAgent = proxyAgent.https;

            } else {

                config.httpsAgent = proxyAgent;

                config.httpAgent = proxyAgent;

            }

        }

        

        const response = await axios.get(PROFILE_URL, config);

        const { email, nickname } = response.data;

        console.log(chalk.white(`✨ [INFO] Profile fetched - Email: ${email}, Nickname: ${nickname}`));

        return { email, nickname };

    } catch (error) {

        console.error(chalk.red.bold(`[ERROR] Failed to fetch user profile: ${error.response?.data?.message || error.message}`));

        throw error;

    }

}



async function getTasks(token, proxyAgent) {

    try {

        const config = {

            headers: {

                'Authorization': `Bearer ${token}`,

                'Accept': 'application/json'

            }

        };

        

        if (proxyAgent) {

            if (proxyAgent.http && proxyAgent.https) {

                config.httpAgent = proxyAgent.http;

                config.httpsAgent = proxyAgent.https;

            } else {

                config.httpsAgent = proxyAgent;

                config.httpAgent = proxyAgent;

            }

        }

        

        const response = await axios.get(BASE_URL, config);

        return response.data;

    } catch (error) {

        console.error(chalk.red.bold(`[ERROR] Failed to fetch task list: ${error.response?.data?.message || error.message}`));

        throw error;

    }

}



async function completeTask(taskId, token, proxyAgent) {

    try {

        const config = {

            headers: {

                'Authorization': `Bearer ${token}`,

                'Accept': 'application/json',

                'Content-Type': 'application/json'

            }

        };

        

        if (proxyAgent) {

            if (proxyAgent.http && proxyAgent.https) {

                config.httpAgent = proxyAgent.http;

                config.httpsAgent = proxyAgent.https;

            } else {

                config.httpsAgent = proxyAgent;

                config.httpAgent = proxyAgent;

            }

        }

        

        const response = await axios.patch(`${BASE_URL}/${taskId}`, {}, config);

        console.log(chalk.green(`✅ [SUCCESS] Task ${taskId} processed: ${response.data.title}`));

        return response.data;

    } catch (error) {

        console.error(chalk.red.bold(`[ERROR] Failed to process task ${taskId}: ${error.response?.data?.message || error.message}`));

        throw error;

    }

}



async function loadCompletedTasks() {

    try {

        const data = await fs.readFile(COMPLETED_TASKS_FILE, 'utf8');

        return JSON.parse(data);

    } catch (error) {

        return {};

    }

}



async function saveCompletedTasks(completedTasks) {

    try {

        await fs.writeFile(COMPLETED_TASKS_FILE, JSON.stringify(completedTasks, null, 2));

    } catch (error) {

        console.error(chalk.red.bold(`[ERROR] Failed to save completed tasks: ${error.message}`));

    }

}



async function dailyCheckIn(day, completedTasks, profile) {

    const today = new Date().toISOString().split('T')[0];

    if (!completedTasks[profile.email]) completedTasks[profile.email] = { checkInDays: {} };

    

    if (!completedTasks[profile.email].checkInDays[today]) {

        console.log(chalk.yellow(`🌟 [INFO] ${profile.email} - Day ${day} - 7-Day Challenge: Boost Your XP - Check-in successful!`));

        completedTasks[profile.email].checkInDays[today] = true;



        if (Object.keys(completedTasks[profile.email].checkInDays).length === 7) {

            console.log(chalk.green.bold(`🎉 [SUCCESS] ${profile.email} - 7-Day Challenge completed! XP Boost earned!`));

        }

    } else {

        console.log(chalk.yellow(`⏳ [INFO] ${profile.email} - Already checked in today (${today})`));

    }

    return completedTasks;

}



function startCountdown() {

    const nextRun = new Date();

    nextRun.setHours(nextRun.getHours() + 24);

    const totalMs = 24 * 60 * 60 * 1000;



    const interval = setInterval(() => {

        const now = new Date();

        const timeLeft = nextRun - now;



        if (timeLeft <= 0) {

            clearInterval(interval);

            console.log(chalk.blue.bold('🚀 [INFO] Countdown complete. Starting next run...'));

        } else {

            const hours = Math.floor(timeLeft / (1000 * 60 * 60));

            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);



            const progress = Math.floor((1 - timeLeft / totalMs) * 10);

            const bar = '█'.repeat(progress) + '░'.repeat(10 - progress);



            process.stdout.write(

                `\r${chalk.yellow('⏰ [INFO] Next run in:')} ${hours}h ${minutes}m ${seconds}s ${chalk.white(`[${bar}]`)}`

            );

        }

    }, 1000);



    return nextRun;

}



async function processAccount(token, completedTasks, proxyAgent) {

    try {

        console.log(chalk.white('👤 [INFO] Fetching user profile...'));

        const profile = await getUserProfile(token, proxyAgent);



        const dayCount = completedTasks[profile.email]?.checkInDays 

            ? Object.keys(completedTasks[profile.email].checkInDays).length + 1 

            : 1;

            

        if (dayCount <= 7) {

            completedTasks = await dailyCheckIn(dayCount, completedTasks, profile);

        } else {

            console.log(chalk.cyan(`🏆 [INFO] ${profile.email} - 7-Day Challenge already completed!`));

        }



        console.log(chalk.white(`📋 [INFO] ${profile.email} - Fetching task list...`));

        const tasks = await getTasks(token, proxyAgent);

        console.log(chalk.white(`📋 [INFO] ${profile.email} - Task list fetched, total tasks: ${tasks.length}`));



        const pendingTasks = tasks.filter(task => 

            task.status === 'new' && (!completedTasks[profile.email]?.tasks || !completedTasks[profile.email].tasks[task.id])

        );

        console.log(chalk.white(`📋 [INFO] ${profile.email} - New pending tasks: ${pendingTasks.length}`));



        for (const task of pendingTasks) {

            console.log(chalk.yellow(`🔧 [INFO] ${profile.email} - Processing task: ${task.title} (ID: ${task.id})`));



            if (task.child && task.child.length > 0) {

                for (const childTask of task.child) {

                    if (childTask.status === 'new' && (!completedTasks[profile.email]?.tasks || !completedTasks[profile.email].tasks[childTask.id])) {

                        await completeTask(childTask.id, token, proxyAgent);

                        if (!completedTasks[profile.email].tasks) completedTasks[profile.email].tasks = {};

                        completedTasks[profile.email].tasks[childTask.id] = true;

                        await new Promise(resolve => setTimeout(resolve, 1000));

                    }

                }

            } else {

                await completeTask(task.id, token, proxyAgent);

                if (!completedTasks[profile.email].tasks) completedTasks[profile.email].tasks = {};

                completedTasks[profile.email].tasks[task.id] = true;

                await new Promise(resolve => setTimeout(resolve, 1000));

            }

        }



        console.log(chalk.green.bold(`🎉 [SUCCESS] ${profile.email} - All new tasks have been processed`));

        return completedTasks;



    } catch (error) {

        console.error(chalk.red.bold(`💥 [ERROR] Account processing failed: ${error.message}`));

        return completedTasks;

    }

}



async function runBot() {

    try {

        console.log(chalk.cyan.bold('═══════════════════════════════════════'));

        console.log(chalk.cyan.bold('         Walme  Bot - KAZUHA787   '));

        console.log(chalk.cyan.bold('═══════════════════════════════════════'));



        console.log(chalk.white('🔑 [INFO] Fetching access tokens...'));

        const tokens = await getAccessTokens();

        console.log(chalk.white(`🔑 [INFO] ${tokens.length} tokens fetched successfully`));



        console.log(chalk.white('🌐 [INFO] Loading proxies...'));

        const proxies = await getProxies();

        

        let completedTasks = await loadCompletedTasks();



        while (true) {

            console.log(chalk.cyan('─'.repeat(40)));



            for (let i = 0; i < tokens.length; i++) {

                const token = tokens[i];

                

                let proxyAgent = null;

                if (proxies.length > 0) {

                    const proxyIndex = i % proxies.length;

                    const proxyString = proxies[proxyIndex];

                    console.log(chalk.white(`🌐 [INFO] Using proxy: ${proxyString.replace(/:[^:]*@/, ':****@')}`));

                    proxyAgent = createProxyAgent(proxyString);

                    

                    if (!proxyAgent) {

                        console.log(chalk.yellow(`[WARNING] Failed to create proxy agent for: ${proxyString}. Continuing without proxy.`));

                    }

                }

                

                completedTasks = await processAccount(token, completedTasks, proxyAgent);

                await new Promise(resolve => setTimeout(resolve, 2000)); 

            }



            await saveCompletedTasks(completedTasks);



            const nextRunTime = startCountdown();

            await new Promise(resolve => setTimeout(resolve, nextRunTime - new Date()));

            console.log('');

        }

    } catch (error) {

        console.error(chalk.red.bold(`💥 [ERROR] Bot execution failed: ${error.message}`));

    }

}
