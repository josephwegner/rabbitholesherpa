import chalk from 'chalk'
import { sendPrompt } from './lib/gpt.js'
import readline from 'readline'
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

let questions = []

function initialInput() {
  rl.question(chalk.green("What would you like to learn about? "), async function(question) {
    rl.pause()
    const prompt = `Respond in full sentences, repeating the topic if necessary. Provide some basic info about this topic: ${question}`
    const response = await sendPrompt(prompt)
    const trimmedResponse = response[0].text.trim()
    questions.push(question)

    const followupResponses = await sendPrompt(`You were just given a topic and asked to provide basic info. Now provide a follow-up question I could ask to gain deeper knowledge. Do not prefix your response with anything like "FOLLOW-UP QUESTION:".
    
TOPIC: ${question}
RESPONSE: ${trimmedResponse}`, {
  n: 4,
  best_of: 10,
  temperature: 1.5
})

    console.log(trimmedResponse)
    console.log("\n")

    showFollowups(followupResponses)
  })
}

function showFollowups(followupResponses) {
  console.log(chalk.green("To learn more, you could ask one of these questions:\n\n"))
  followupResponses.forEach((response, index) => {
    console.log(chalk.green(`${index + 1}: ${response.text.trim()}`))
  })
  console.log('\n')

  rl.question(chalk.green("Enter the number of the question you would like to ask, or enter your own question: "), async function(selection) {
    rl.pause()
    if(isInt(selection)) {
      let question = followupResponses[parseInt(selection) - 1]
      if(question) {
        question = question.text.trim()
        questions.push(question)
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
  const response = await sendPrompt(buildPreface(questions) + followup)
  questions.push(followup)

  const followupResponses = await sendPrompt(`You have been given a topic and asked to answer questions about that topic. Now provide a follow-up question I could ask to gain deeper knowledge. Do not prefix your response with anything like "FOLLOW-UP QUESTION:".
    
  TOPIC: ${questions[0]}
  QUESTIONS ALREADY ASKED: ${questions.slice(1).map(question => {
    return `- ${question}`
  })}`, {
    n: 4,
    best_of: 10,
    temperature: 1.5
  })

  console.log(response[0].text.trim() + "\n\n")
  showFollowups(followupResponses)
}

function buildPreface(history) {
  // Falsy check for empty array, or potential bad data
  if(!history || history.length === 0) { return '' }

  return `You have been asked a number of questions about this topic: ${history[0]}
  
Please answer this new question about that topic: `
}

function isInt(value) {
  return !isNaN(value) && 
         parseInt(Number(value)) == value && 
         !isNaN(parseInt(value, 10));
}

initialInput()