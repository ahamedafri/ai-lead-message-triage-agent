<div align="center">
<div align="center">

# 🤖 AI Lead & Message Triage Agent

**Intelligent inbox automation for small businesses**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-ai--lead--message--triage--agent.onrender.com-blue)](https://ai-lead-message-triage-agent.onrender.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express)](https://expressjs.com/)

Automate customer message triage with AI. Classify inbound messages by priority, lead quality, and urgency. Generate professional draft replies in seconds. Perfect for agencies, support teams, and customer-facing businesses.

[**View Demo**](#demo) • [**Quick Start**](#quick-start) • [**Features**](#features) • [**Architecture**](#architecture)

</div>

---

## 🎯 Overview

The **AI Lead & Message Triage Agent** is an intelligent inbox system that processes incoming customer messages across multiple channels (WhatsApp, Instagram, Email, Web Forms) and automatically:

- **Classifies** messages by priority (urgent, normal, low)
- **Assesses** lead quality (strong, weak, unclear)
- **Flags** messages requiring human review (legal issues, escalations, sensitive topics)
- **Drafts** professional replies automatically
- **Logs feedback** for continuous model improvement
- **Works offline** with smart heuristic fallbacks

Perfect for:
- 🎬 **Creative Agencies** — Qualify video/photography leads instantly
- 💼 **Small Businesses** — Handle customer complaints & inquiries efficiently  
- 📧 **Support Teams** — Triage urgent issues from the noise
- 🛍️ **E-commerce** — Process order inquiries and complaints

---

## ✨ Features

### 🧠 AI-Powered Classification
- **Groq Llama 3.3 Integration** — Fast, accurate message analysis
- **Priority Detection** — Urgent vs. standard vs. low priority
- **Lead Quality Scoring** — Strong prospects vs. spam detection
- **Sensitivity Flagging** — Auto-detect legal/HR disputes requiring escalation
- **Smart Heuristics** — Works perfectly without API key (demo mode)

### 📊 Unified Inbox Dashboard
- **Multi-Channel Support** — WhatsApp, Instagram, Email, Website forms
- **Real-Time Filtering** — By urgency, channel, category, or status
- **Statistics Dashboard** — Urgent count, total inbound, channel breakdown
- **Dark Mode** — Eye-friendly interface for long shifts

### ✍️ Intelligent Reply Drafting
- **AI-Generated Responses** — Context-aware, professional tone
- **Channel-Aware Length** — Shorter for social, formal for email
- **Manual Customization** — Edit before sending
- **Fallback Replies** — Perfect templates when API unavailable

### 📈 Feedback & Fine-Tuning
- **Decision Logging** — Track all approvals, edits, rejections
- **Accuracy Metrics** — Monitor model agreement with human judgment
- **Fine-Tuning Dataset** — Export feedback for model training
- **Persistent Storage** — All data saved locally

### 🎮 Demo & Testing
- **7 Pre-Built Samples** — Realistic scenarios (leads, complaints, spam)
- **Live Simulator** — Watch the system handle a stream of messages
- **Manual Test Mode** — Enter custom messages instantly
- **No Setup Required** — Try immediately without API key

---

## 🚀 Quick Start

### 1. **Clone & Install**
```bash
git clone https://github.com/ahamedafri/ai-lead-message-triage-agent.git
cd ai-lead-message-triage-agent
npm install
