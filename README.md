# Walme-Bot
An automated bot for completing Walme airdrop tasks with comprehensive proxy support (HTTP, SOCKS4, SOCKS5).
## 📢 Join Our Community

# Telegram Channel: .[Channel](https://t.me/Offical_Im_kazuha)
# GitHub Repository: [Walme](https://github.com/Kazuha787/Walme-Bot.git)

## Register

- https://waitlist.walme.io?inv=GZIGVI

## Features

- 🚀 Automatically completes all available Walme waitlist tasks
- ✅ Daily check-in for the 7-Day Challenge XP Boost
- 🔄 Automatic rescheduling for continuous operation 
- 🌐 Complete proxy support (HTTP, SOCKS4, SOCKS5)
- 📊 Detailed logging with colorful console output
- 👥 Multi-account support through tokens.txt
- 🔄 Tracks completed tasks to avoid duplication

## Requirements

- Node.js (v16 or higher)
- NPM or Yarn package manager

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Kazuha787/Walme-Bot.git
cd Walme-Bot
```

2. Install dependencies:
```bash
npm install
```

3. Create configuration files:

Create a `tokens.txt` file in the root directory with one token per line:
```
yourToken1
yourToken2
```

For proxy support, create a `proxies.txt` file with one proxy per line:
```
http://username:password@host:port
socks5://username:password@host:port
host:port
username:password@host:port
host:port:username:password
```

## Usage

### How to get tokens?
- F12 on dashboard
- Go to Local Storage
- Copy Access Token

Start the bot with:
```bash
npm start
```

The bot will:
1. Load your tokens from tokens.txt
2. Load proxies from proxies.txt (if available)
3. Process each account, completing all available tasks
4. Check in for the 7-Day Challenge
5. Repeat the process every 24 hours

## Proxy Support

The bot supports various proxy formats:
