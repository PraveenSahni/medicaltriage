import { Skill, SkillProficiency } from '../types/console';

export const COMPREHENSIVE_SKILLS: Skill[] = [
  {"c":"Blueverse-AI Assurance","n":"Core AI Evaluation","w":"Evaluating and validating core AI model performance and accuracy.","u":25,"i":55,"d":-29},
  {"c":"Blueverse-AI Assurance","n":"Generative AI Evaluation","w":"Assessing generative AI outputs for quality, safety, and reliability.","u":20,"i":60,"d":-29},
  {"c":"Blueverse-GenAI/Agentic AI-Platform","n":"Agentic Framework","w":"Building autonomous AI agents using agentic frameworks like LangChain, AutoGPT.","u":12,"i":57,"d":-38},
  {"c":"Blueverse-GenAI/Agentic AI-Platform","n":"Kubernetes","w":"Container orchestration for scalable GenAI platform deployment.","u":22,"i":75,"d":-13},
  {"c":"Python-AWS AI Services","n":"AWS AI Services","w":"Leveraging AWS AI/ML managed services for intelligent applications.","u":60,"i":90,"d":34},
  {"c":"Python-AWS AI Services","n":"AWS Bedrock","w":"AWS Bedrock for building GenAI applications with foundation models.","u":60,"i":90,"d":34},
  {"c":"Python-Azure AI Services","n":"Azure AI Studio","w":"Azure AI Studio for building and deploying AI solutions.","u":60,"i":90,"d":34},
  {"c":"Python-Azure AI Services","n":"Azure Open AI Service","w":"Azure OpenAI Service for GPT and DALL-E integration.","u":60,"i":90,"d":34},
  {"c":"Python-GCP AI Services","n":"GCP AI Services","w":"Google Cloud AI services for intelligent applications.","u":60,"i":90,"d":34},
  {"c":"Python-GCP AI Services","n":"GCP Gemini","w":"Google Gemini multimodal AI model integration.","u":60,"i":90,"d":34},
  {"c":"Python-Computer Vision","n":"Industrial AI - Deeplearning algorithms","w":"Industrial computer vision using deep learning for manufacturing/automation.","u":50,"i":90,"d":25},
  {"c":"Python-NLP","n":"Python-NLTK","w":"Natural Language Toolkit (NLTK) for text processing and analysis.","u":53,"i":90,"d":28},
  {"c":"Blueverse-Ethical AI/GenAI","n":"AI Ethics and Laws","w":"AI ethics principles, bias detection, and responsible AI practices.","u":25,"i":75,"d":-11},
  {"c":"Blueverse-Ethical AI/GenAI","n":"Responsible AI","w":"Building fair, transparent, and accountable AI systems.","u":15,"i":50,"d":-42},
  {"c":"Blueverse-Data Engineering","n":"Databricks","w":"Databricks platform for data engineering pipelines.","u":37,"i":77,"d":2},
  {"c":"Blueverse-Data Engineering","n":"Snowflake","w":"Snowflake data platform for AI/ML data management.","u":37,"i":77,"d":2},
  {"c":"Blueverse-Data Engineering","n":"Vector Databases and Embedding","w":"Vector database engineering for AI embeddings storage.","u":37,"i":77,"d":2},
  {"c":"Databricks","n":"Databricks Python","w":"Databricks Python for data engineering and ML.","u":57,"i":90,"d":31},
  {"c":"Databricks","n":"Mosaic AI","w":"Databricks Mosaic AI for foundation model training.","u":25,"i":55,"d":-29},
  {"c":"Python-Data Science-AWS","n":"AWS ML","w":"Data science on AWS using Python and SageMaker.","u":60,"i":90,"d":34},
  {"c":"Python-Data Science-Azure","n":"Azure ML","w":"Data science on Azure using Python and Azure ML.","u":60,"i":90,"d":34},
  {"c":"Python-Data Science-GCP","n":"GCP Vertex AI","w":"Data science on GCP using Python and Vertex AI.","u":60,"i":90,"d":34},
  {"c":"Blueverse-Devops/AgenticAI","n":"Docker","w":"Docker containerization for AI application packaging.","u":27,"i":70,"d":-13},
  {"c":"Blueverse-Devops/AgenticAI","n":"Git","w":"Git version control for AI/ML code management.","u":27,"i":70,"d":-13},
  {"c":"Blueverse-Devops/AgenticAI","n":"Terraform","w":"Terraform for AI infrastructure automation.","u":35,"i":73,"d":-4},
  {"c":"Blueverse-AI Core","n":"Hardware Aware Finetuning/Quantization/Inferencing","w":"Hardware-aware AI optimization and model quantization.","u":25,"i":55,"d":-29},
  {"c":"Blueverse-AI Core","n":"NVIDIA-AI","w":"NVIDIA GPU computing for AI acceleration.","u":30,"i":65,"d":-15},
  {"c":"Blueverse-GenAI/Agentic AI Frontend","n":"Angular","w":"Angular framework for GenAI frontend development.","u":37,"i":87,"d":11},
  {"c":"Blueverse-GenAI/Agentic AI Frontend","n":"ReactJS","w":"React framework for GenAI frontend applications.","u":37,"i":87,"d":11},
  {"c":"Blueverse-ML Engineering","n":"MLOps","w":"MLOps practices for production ML systems.","u":35,"i":73,"d":-4},
  {"c":"Automation - Automation Anywhere","n":"RPA - Automation Anywhere","w":"Robotic Process Automation using Automation Anywhere.","u":40,"i":80,"d":7},
  {"c":"Automation - UiPath","n":"RPA - UiPath","w":"Robotic Process Automation using UiPath platform.","u":40,"i":80,"d":7},
  {"c":"Blueverse-GenAI Testing","n":"Selenium-Python -Testing","w":"Selenium automation for GenAI UI testing.","u":78,"i":90,"d":50},
  {"c":"AI Architecture - AWS","n":"AWS Cloud Architecture","w":"AWS cloud architecture design for AI solutions.","u":35,"i":80,"d":3},
  {"c":"AI Architecture - Azure","n":"Azure Cloud Architecture","w":"Azure cloud architecture design for AI solutions.","u":35,"i":80,"d":3},
  {"c":"AI Architecture - GCP","n":"GCP Cloud Architecture & Services","w":"GCP cloud architecture design for AI solutions.","u":35,"i":80,"d":3}
]; // Simplified representative list for app rebuild

export const PROFICIENCY_DATA: Record<string, SkillProficiency> = {
  "GCP Cloud Architecture & Services": {
    "L1": {"assess":"Validation In-Progress"},
    "L2": {"course":"Shared","cert":"Shared"},
    "L3": {"course":"Shared","cert":"Shared"},
    "L4": {"course":"Shared","cert":"Shared"}
  },
  "Vector Databases and Embedding": {
    "L1": {"course":"https://shoshin.ltimindtree.com/detailsPage/Course/201/10485","assess":"Approved","cert":"201 - Gen AI Foundation"},
    "L2": {"course":"https://shoshin.ltimindtree.com/detailsPage/Course/201/10485","cert":"201 - Gen AI Foundation"},
    "L3": {"course":"https://shoshin.ltimindtree.com/detailsPage/Course/201/10485","cert":"201 - Gen AI Foundation"},
    "L4": {"course":"https://shoshin.ltimindtree.com/detailsPage/Course/201/10485","cert":"201 - Gen AI MS Azure AI and NLP"}
  },
  "AWS Bedrock": {
    "L1": {"course":"https://shoshin.ltimindtree.com/detailsPage/Course/201/22723","assess":"Internal Assessment","cert":"AWS certified Cloud Practitioner"},
    "L2": {"course":"https://shoshin.ltimindtree.com/detailsPage/Course/201/22723","cert":"AWS certified Developer - Associate"},
    "L3": {"course":"https://shoshin.ltimindtree.com/detailsPage/Course/201/22723","cert":"AWS Certified Solutions Architect - Associate"},
    "L4": {"course":"https://shoshin.ltimindtree.com/detailsPage/Course/201/22723","cert":"AWS Certified Data Analytics - Specialty"}
  },
  "GCP Gemini": {
    "L1": {"assess":"Approved"},
    "L2": {"course":"https://rsvp.withgoogle.com/events/partner-learning/skill_badge_list","cert":"https://rsvp.withgoogle.com/events/partner-learning/skill_badge_list"},
    "L3": {"course":"https://rsvp.withgoogle.com/events/partner-learning/skill_badge_list","cert":"Professional Machine Learning Engineer"},
    "L4": {"course":"https://rsvp.withgoogle.com/events/partner-learning/skill_badge_list","cert":"Advanced level"}
  }
};
