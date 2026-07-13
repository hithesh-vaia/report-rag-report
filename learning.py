from typing import TypedDict
import random
from typing import Literal

from langgraph.graph import StateGraph, START , END

class State(TypedDict):
    graph_state:str



def node1(state):
    print("This is 1 this got invoked")


    return {"graph_state":state["graph_state"]+ "I am"}

def node2(state):
    print("This is 2 this got invoked")


    return {"graph_state":state["graph_state"]+ "Happy!"}

def node3(state):
    print("This is 3 this got invoked")

    return {"graph_state":state["graph_state"]+ "Sad!"}




def decide_mood(state) -> Literal["node_2","node_3"]:

    user_input= state["graph_state"]
    print("Crazy thing will happen")
    if random.random()<0.5:
        return "node_2"
    else:
        return "node_3"


builder =StateGraph(State)

builder.add_node("node_1",node1)

builder.add_node("node_2",node2)

builder.add_node("node_3",node3)


#logic
builder.add_edge(START,"node_1")
builder.add_conditional_edges("node_1",decide_mood)
builder.add_edge("node_2",END)
builder.add_edge("node_3",END)


graph  =builder.compile()


graph.invoke({"graph_state":"Life is so much more than her"})
