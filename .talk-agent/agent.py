"""FatedReel Talk: patient A1–A2 voice practice, hosted outside Pages."""
import os
from pathlib import Path

from dotenv import load_dotenv
from livekit import agents, rtc
from livekit.agents import Agent, AgentServer, AgentSession, TurnHandlingOptions, inference
from livekit.plugins import openai, silero

load_dotenv(Path(__file__).with_name('.env.local'))

INSTRUCTIONS = """You are a patient English conversation partner for one Turkish-speaking
adult at CEFR A1–A2. Speak slowly and naturally, using short, everyday English.
Keep replies to one or two short sentences and at most one question at a time.
The learner needs long thinking pauses. Never finish their sentences. Never
interpret hesitation, repeated words, 'I... I...', 'wait', 'bir dakika', or
'düşünüyorum' as a request for help. Do not fill silence with encouragement.
If the learner explicitly asks you to wait, remain silent until they continue.
The Turkish word 'bitti' is an end-of-turn cue, not lesson vocabulary; respond
to what preceded it. It does not end the session. The app also offers a finish
turn button. Let the learner choose the topic and stay in role during roleplay.
Do not turn the conversation into a grammar lecture. Correct only when asked,
or briefly when an error prevents understanding; then continue the conversation.
Use brief Turkish explanations only when requested or clearly needed.
Never claim you can guarantee perfect turn detection. You are an AI teacher.
"""

server = AgentServer()


@server.rtc_session(agent_name='fatedreel-talk')
async def entrypoint(ctx: agents.JobContext):
    session = AgentSession(
        vad=silero.VAD.load(min_silence_duration=0.55),
        turn_handling=TurnHandlingOptions(
            turn_detection=inference.TurnDetector(),
            endpointing={'mode': 'dynamic', 'min_delay': 0.8, 'max_delay': 6.0},
        ),
        llm=openai.realtime.RealtimeModel(
            model=os.getenv('OPENAI_REALTIME_MODEL', 'gpt-realtime-2.1'),
            voice='coral',
            turn_detection=None,
        ),
    )

    await ctx.connect()
    learner = await ctx.wait_for_participant()

    @ctx.room.local_participant.register_rpc_method('finish_turn')
    async def finish_turn(data: rtc.RpcInvocationData) -> str:
        if data.caller_identity != learner.identity:
            raise rtc.RpcError(1500, 'Unauthorized participant')
        if session.agent_state in ('thinking', 'speaking'):
            return 'already-processing'
        session.commit_user_turn()
        return 'ok'

    await session.start(room=ctx.room, agent=Agent(instructions=INSTRUCTIONS))
    await session.generate_reply(
        instructions='Greet in simple English in one short sentence, then ask what the learner would like to talk about. After that, wait.'
    )


if __name__ == '__main__':
    agents.cli.run_app(server)
