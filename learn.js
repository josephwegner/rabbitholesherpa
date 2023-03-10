import chalk from 'chalk'
import { chat } from './lib/gpt.js'
import readline from 'readline'
import { CHAT } from './lib/constants.js'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

let questions = []
let topic

function initialInput() {
  rl.question(chalk.green("What would you like to learn about? "), async function(input) {
    rl.pause()
    topic = input

    const response = await chat([{
      actor: CHAT.PREFIX,
      content: `Respond in full sentences, repeating the topic if necessary. Provide some basic info about this topic: ${topic}`
    }])
    const trimmedResponse = response[0].message.content.trim()

    const followupResponses = await getFollowups()

    console.log(trimmedResponse)
    console.log("\n")

    showFollowups(followupResponses)
  })
}

function showFollowups(followupResponses) {
  console.log(chalk.green("To learn more, you could ask one of these questions:\n\n"))
  followupResponses.forEach((response, index) => {
    console.log(chalk.green(`${index + 1}: ${response.message.content.trim()}`))
  })
  console.log('\n')

  rl.question(chalk.green("Enter the number of the question you would like to ask, or enter your own question: "), async function(selection) {
    rl.pause()
    if(isInt(selection)) {
      let question = followupResponses[parseInt(selection) - 1]
      if(question) {
        question = question.message.content.trim()
        console.log(chalk.cyan(question))
        askFollowup(question)
      } else {
        console.log(chalk.red("\nThat was not a valid selection.\n"))
        showFollowups(followupResponses)
      }
    } else {
      askFollowup(selection)
    }
  })
}

async function askFollowup(followup) {
  const response = await chat([
    {
      actor: CHAT.PREFIX,
      content: buildPreface(questions)
    },
    {
      actor: CHAT.USER,
      content: `Answer this new question about that topic: ${followup}`
    }
  ])
  questions.push(followup)

  const followupResponses = await getFollowups()

  console.log(response[0].message.content.trim() + "\n\n")
  showFollowups(followupResponses)
}

async function getFollowups() {
  let prompts = [{
    actor: CHAT.PREFIX,
    content: `You were asked to provide basic info about ${topic}, to help guide a human through understanding a new topic. You were then asked a number of follow-up questions, to which you have already responded.`
  }]

  Array.prototype.push.apply(prompts, questions.map(question => {
    return {
      actor: CHAT.AI,
      content: `I previously asked: ${question}`
    }
  }))

  prompts.push({
    actor: CHAT.USER,
    content: 'Provide one follow-up question I could ask to gain deeper knowledge. Do not wrap the response in any characters like quotes, or prefix the question with anything conversational.'
  })

  return await chat(prompts, {
    n: 4,
    temperature: 1.5
  })
}

function buildPreface() {
  // Falsy check for empty array, or potential bad data
  if(!questions || questions.length === 0) { return '' }

  return `You have been asked a number of questions about this topic: ${topic}

The previous questions were: 
${questions.map(question => {
  return `\n    - ${question}`
})}
`
}

function isInt(value) {
  return !isNaN(value) && 
         parseInt(Number(value)) == value && 
         !isNaN(parseInt(value, 10));
}

initialInput()