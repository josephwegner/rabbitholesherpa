import chalk from 'chalk'
import { sendPrompt } from './lib/gpt.js'
import readline from 'readline'
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

let conversations = []

function getInput() {
  rl.question(chalk.green("What is your prompt? "), async function(prompt) {
    rl.pause()
    const response = await sendPrompt(buildPreface(conversations)+prompt)
    conversations.push({
      prompt,
      response: response[0].text.trim()
    })

    console.log(response[0].text.trim())
    console.log("\n")

    // This might make an infinite call stack. It's not a huge concern in this use case
    getInput()
  })
}

function buildPreface(history) {
  // Falsy check for empty array, or potential bad data
  if(!history || history.length === 0) { return '' }
  let preface = `Consider the following context for a conversation you are in the middle of. In this conversation, your responses will be prefixed with "OPENAI:". The prompter's prompts will be prefixed with "USER:". The triple dashes ("---") will denote the end of the conversation so far. Here is the conversation so far:\n`
  preface += history.map((conversation) => {
    return `USER: ${conversation.prompt}
OPENAI: ${conversation.response}`
  }).join('\n\n')
  preface += '\n\n---\nGiven that context, respond to the following prompt. Do not prefix your response with "OPENAI": '

  return preface
}

getInput()