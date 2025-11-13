from flask import Flask,request,jsonify
from dotenv import load_dotenv
import os
load_dotenv()

os.environ["LANGCHAIN_API_KEY"]=os.getenv("LANGCHAIN_API_KEY")
os.environ["GROQ_API_KEY"]=os.getenv("GROQ_API_KEY")
port = os.getenv("PORTAI")

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate,MessagesPlaceholder
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.output_parsers import StrOutputParser

HistoryContainer ={}
def getMessageHistory(session_id : str)->BaseChatMessageHistory:
    if session_id not in HistoryContainer.keys():
        HistoryContainer[session_id]=ChatMessageHistory()
    return HistoryContainer[session_id]



outputParser = StrOutputParser()
llm = ChatGroq(model="llama-3.3-70b-versatile")
SystemPrompt = ''' 
You are a multilingual AI support assistant designed to help people affected by disasters. 
Your purpose is to offer calm, compassionate, and easy-to-understand guidance in the user’s preferred language. 
Always reply briefly, using clear, emotionally supportive, and actionable language.

Core functions:
1. Provide gentle emotional support, stress management tips, and basic coping strategies.
2. Encourage users with empathy and positivity — never sound robotic or dismissive.
3. Connect users to verified human counselors, helplines, or NGOs offering real assistance when needed.
4. Support multiple languages — reply in the same language the user speaks.
5. Provide verified helpline numbers and other relevant resources, specifically for Uttarakhand, naturally in context when relevant.
6. Avoid giving medical or legal diagnoses. Always suggest professional help where necessary.
7. Keep every response concise, friendly, and emotionally reassuring.

Tone: Warm, understanding, hopeful, and culturally sensitive.
Goal: Make the user feel heard, safe, and guided — never overwhelmed.

Important: You are only to respond within the scope above. If a query is outside your expertise, reply: "Sorry, this problem is out of my expertise."
"

'''
prompt = ChatPromptTemplate.from_messages(
    [
    ("system",SystemPrompt),
    (MessagesPlaceholder("chat_history")),
    ("user","{input}")
    ]
)

normalChain = prompt|llm|StrOutputParser()

chain_with_message_history = RunnableWithMessageHistory(
    normalChain,
    get_session_history=getMessageHistory,
    history_messages_key="chat_history",
    input_messages_key="input"
)





app = Flask(__name__)




@app.route("/ai_response", methods=["POST"])
def AIResponse():
    data = request.get_json()
    user_query = data.get("query")
    if not user_query:
        return "Ask me Question.."
    
    try:
        config ={
        "configurable":{"session_id":"chat1"}
        }
        res = chain_with_message_history.invoke(
            {"input":user_query},
            config=config
        )
        res = chain_with_message_history.invoke({"input": user_query}, config=config)
        return res


    except Exception as e:
        print("Error:", e)
        return "Result not found"


if __name__ == "__main__":
    app.run(host='0.0.0.0',port=port)