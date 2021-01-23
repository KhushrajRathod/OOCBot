const { App, ExpressReceiver } = require('@slack/bolt')

const receiver = new ExpressReceiver({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    endpoints: '/slack/events'
})

const app = new App({
    receiver,
    token: process.env.SLACK_BOT_TOKEN
})

const outOfContextChannelID = 'C01270P3XFV'
const outOfContextSandboxChannelID = 'C01JXGVB99U'

app.event('message', async ({ event, client }) => {
    if (
        (event.channel === outOfContextChannelID
            || event.channel === outOfContextSandboxChannelID)
        && event.attachments && event.attachments[0].is_share && event.attachments[0].is_msg_unfurl
    ) {

        const messageThreadMatch = event.attachments[0].from_url.match(/thread_ts=(.*)&/)

        let inChannel = event.attachments[0].channel_id
        let ts = messageThreadMatch ? messageThreadMatch[1].slice(0, -6) + '.' + messageThreadMatch[1].slice(-6) : event.attachments[0].ts
        let outOfContexter = event.user

        const response = await client.chat.getPermalink({
            channel: event.channel,
            message_ts: event.ts
        })

        // console.log("OOC in channel: " + inChannel)
        // console.log("OOC ts: " + ts)
        // console.log("OOCer: " + outOfContexter)
        // console.log("OOCer Message Permalink: " + response.permalink)

        await client.chat.postMessage({
            channel: inChannel,
            text: `<@${event.attachments[0].author_id}> was OOCed by <@${outOfContexter}>! ${response.permalink}`,
            thread_ts: ts,
            unfurl_links: false,
            unfurl_media: false
        })
    }
})

async function main() {
    await app.start(process.env.PORT || 3000)
    console.log('⚡️ Bolt app is running!')
}

receiver.app.get('/ping', (_, res) => {
    res.send('Online')
})

main()
