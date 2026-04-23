import os
import gymnasium as gym
from stable_baselines3 import PPO
from stable_baselines3.common.vec_env import DummyVecEnv

from test_env import BengaluruBusEnv

def main():
    os.makedirs("models", exist_ok=True)
    
    print("Instantiating BengaluruBusEnv...")
    env = BengaluruBusEnv()
    
    print("Wrapping environment in DummyVecEnv...")
    vec_env = DummyVecEnv([lambda: env])
    
    print("Initializing PPO Agent with MlpPolicy...")
    model = PPO("MlpPolicy", vec_env, verbose=1)
    
    print("Starting training for 100,000 timesteps...")
    model.learn(total_timesteps=100_000)
    
    model_path = "models/eco_sync_ppo"
    model.save(model_path)
    print(f"Model successfully saved to {model_path}.zip")

if __name__ == "__main__":
    main()
