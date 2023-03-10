import { Configuration, OpenAIApi } from "openai"
import chalk from 'chalk'
import { CHAT } from "./constants.js"

const DEBUG = process.env.DEBUG === 'true'
const configuration = new Configuration({
  apiKey: process.env.OPENAI_SECRET_KEY,
})
const openai = new OpenAIApi(configuration)

export async function chat(messages, options) {
  let prompt = messages.map(message => {
    return {
      role: CHAT[message.actor] || CHAT.USER,
      content: message.content
    }
  })

  return api(openai.createChatCompletion, prompt, Object.assign({
    model: 'gpt-3.5-turbo'
  }, options))
}

export async function sendPrompt(prompt, options) {
  return api(openai.createCompletion, prompt, options)
}

async function api(method, prompt, options) {
  let promptKey = method.name === 'createChatCompletion' ? 'messages' : 'prompt'
  const resp = await method.call(openai, Object.assign({
    model: "text-davinci-003",
    temperature: 0,
    max_tokens: parseInt(process.env.MAX_RESPONSE_LENGTH || 100) - prompt.length,
    [promptKey]: prompt
  }, options || {})
)

  if (DEBUG) {
    console.log(chalk.magenta(`Calling ${method.name}`))
    console.log(chalk.magenta(`Prompt Tokens: ${resp.data.usage.prompt_tokens},
  Completion Tokens: ${resp.data.usage.completion_tokens},
  Total Tokens: ${resp.data.usage.total_tokens}

    `))

  }

  return resp.data.choices
}