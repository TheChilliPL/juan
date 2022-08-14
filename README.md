# juan.

A simple Discord utility bot made with [TypeScript] and [Discord.js].

[TypeScript]: https://www.typescriptlang.org/
[Discord.js]: https://discord.js.org/

## How to use

### Public instance

To use the public instance of this bot, the only thing you have to do first is [invite him to your server by clicking here][invite].

Some features may require additional configuration.

[invite]: https://discord.com/api/oauth2/authorize?client_id=949287774845018192&permissions=0&scope=applications.commands%20bot

### Private instance

To use the private instance of this bot, you need to [create an application](https://discordapp.com/developers/applications/me) and [get your bot token](https://discordapp.com/developers/applications/me).

Note that the instance is provided in an as-is state, and we do not provide any guarantees. Nonetheless, if something doesn't work, you can always [report an issue][issues].

You can pass the token using the `TOKEN` environment variable, or put it as such in the `.env` file in the root directory:

```sh
TOKEN=YOUR_TOKEN_HERE
```

Ensure that the `vault` directory created by the bot in its root folder to store data is accessible and persistent.

To start the bot, just run `npm start` in the root directory.

[issues]: https://github.com/TheChilliPL/juan/issues
