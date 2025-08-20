import React, { useEffect, useState } from "react";
import API from "../utils/api";

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // fetch goals
  const fetchGoals = async () => {
    try {
      const { data } = await API.get("/goals");
      setGoals(data);
    } catch (error) {
      console.error(error.response?.data || error.message);
    }
  };

  // add goal
  const addGoal = async (e) => {
    e.preventDefault();
    try {
      await API.post("/goals", { title, description });
      setTitle("");
      setDescription("");
      fetchGoals();
    } catch (error) {
      console.error(error.response?.data || error.message);
    }
  };

  // delete goal
  const deleteGoal = async (id) => {
    try {
      await API.delete(`/goals/${id}`);
      fetchGoals();
    } catch (error) {
      console.error(error.response?.data || error.message);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">My Goals</h1>

      <form onSubmit={addGoal} className="mb-6">
        <input
          type="text"
          placeholder="Goal Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="p-2 mr-2 rounded text-black"
        />
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="p-2 mr-2 rounded text-black"
        />
        <button type="submit" className="bg-blue-600 px-4 py-2 rounded">
          Add Goal
        </button>
      </form>

      <ul>
        {goals.map((goal) => (
          <li
            key={goal._id}
            className="flex justify-between items-center bg-gray-800 p-3 mb-2 rounded"
          >
            <div>
              <h2 className="font-semibold">{goal.title}</h2>
              <p className="text-sm text-gray-400">{goal.description}</p>
            </div>
            <button
              onClick={() => deleteGoal(goal._id)}
              className="bg-red-600 px-3 py-1 rounded"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
