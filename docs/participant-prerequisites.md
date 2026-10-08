# Prerequisites for running Enterprise Copilot

We have put together this guide to help you set up your laptop before our Flo 2026 workshop. Please install the tools below before the session. We have explained the Java terms as well, so you can follow along even if you are not from a Java background.

We will keep the prerequisites and code for download in this [OneDrive folder](https://nagarro-my.sharepoint.com/:f:/p/harsh_vishwakarma/IgA-dVf8omFdQIWChgx88CW2ASEKd1rw9TJE_HZF2FwdH0I?e=q408jm). We will update the code there once our checks are done.

## 1. What we need you to have

| Tool | Version | Why it is needed |
| --- | --- | --- |
| Java Development Kit (JDK) | **21** | To build and run the backend |
| Node.js | **22.12 or later in Node 22**, or **Node 24 LTS** | To run the frontend |
| npm | Comes with Node.js | To install frontend packages |
| Code editor | VS Code, IntelliJ IDEA, or your preferred editor | To view and edit the code |
| Browser | Chrome, Edge, Firefox, or Safari | To open the application |
| Terminal | PowerShell on Windows, Terminal on macOS/Linux | To run commands |

Use one of the Node versions listed above. Some of the tools we use do not support every newer Node version.

You will also need:

- A Windows, macOS, or Linux laptop and a charger.
- Internet to download the tools and project packages.
- Permission to install software on your laptop. If this needs IT approval, please get it before the workshop.
- A few GB of free disk space. We recommend a laptop with 8 GB RAM or more. We have not tested the minimum requirements.
- Ports **8080** and **5173** available. If another application uses these ports, stop it before running this project.

You should know how to open a terminal, change folders using `cd`, run a command, and edit a file. We do not expect you to know Java or Spring Boot before the session.

## 2. Where to download the tools

- [Java — Eclipse Temurin](https://adoptium.net/installation/): choose **Java 21** and **JDK** for your operating system and processor.
- [Node.js](https://nodejs.org/en/download): choose **Node 22.12+ in Node 22**, or **Node 24 LTS**. npm comes with it.

After installing, close and reopen your terminal.

### If you are new to Java

**JDK** means Java Development Kit. It includes the tools to build and run Java code. Install the JDK, not just the JRE. The JRE only runs Java code.

**Maven** downloads the Java packages and builds the backend. You do not need to install it separately. We have included `mvnw` and `mvnw.cmd` in the project folder. These download the required Maven version for you.

We use **Spring Boot** for the backend. Maven downloads it, so there is no separate installation.

**JAVA_HOME** is the location of your JDK installation. If you have set it, it should point to the JDK folder, not the `bin` folder. **PATH** lets your terminal find commands like `java`, `node`, and `npm`.

## 3. Do you need an API key?

| Mode | How it works | What you need |
| --- | --- | --- |
| DEMO | Uses fixed responses we have included in the project | No API key |
| LIVE with OpenAI | Sends requests to an AI model | An OpenAI API key with model access and available API quota |

We suggest starting with DEMO to check that the application runs on your laptop. You still need internet for the first download of project packages.

For LIVE, you also need internet access to OpenAI. We use `gpt-4o-mini` as the default model.

## 4. Check your network

Your laptop should be able to access:

- OneDrive — to download the project folder we will share for the workshop.
- `registry.npmjs.org` — to download frontend packages.
- `repo.maven.apache.org` — to download Maven and backend packages.
- `api.openai.com` — if you will use OpenAI LIVE mode.

If you use a company laptop with a proxy or VPN, try the setup before the workshop. Ask IT for help if downloads are blocked or you get certificate errors.

Maven needs to save files in your user folder. On macOS/Linux, you also need `unzip`, or `tar` with gzip support, to extract its download. Windows uses PowerShell through `mvnw.cmd`.

## 5. Download the project folder

You can find the prerequisites and download the code from our [OneDrive folder](https://nagarro-my.sharepoint.com/:f:/p/harsh_vishwakarma/IgA-dVf8omFdQIWChgx88CW2ASEKd1rw9TJE_HZF2FwdH0I?e=q408jm). We will update the code after our checks are done.

Download the project folder from this link. If it downloads as a ZIP file, extract it first. Keep all the files and folders together.

Open the downloaded folder in your editor. Find the folder that contains `backend`, `frontend`, and `README.md`. When we say **project folder** below, we mean this folder. Open your terminal there before running the commands below.

You do not need Git to download or run this copy of the project.

## 6. Check the installed versions

Run these commands in a new terminal:

```text
java -version
javac -version
node --version
npm --version
```

Check that:

- `java` and `javac` both show version **21**. `java` runs the code, and `javac` compiles it.
- Node shows **22.12 or later in Node 22**, or **24**.
- npm shows a version number.

If a command is not found, check the installation and PATH. If Java shows a different version, check JAVA_HOME and which JDK your terminal is using.

Now check Maven. Start from the project folder and use the commands for your operating system.

**Windows PowerShell:**

```powershell
cd backend
.\mvnw.cmd -version
```

**macOS/Linux:**

```bash
cd backend
sh ./mvnw -version
```

You should see the Maven version and Java 21. The first run may download Maven, so wait for it to finish.

## 7. Try running the application

We would like you to try running the application once before the workshop. This will download the packages and help you find any setup problems before the session.

Our application has two parts. The **backend** runs on port 8080. The **frontend** is the dashboard you open in your browser, on port 5173. You need to keep both running.

### Start both with our script

We have included `scripts/start.sh` to start both the backend and frontend from one terminal. It checks the ports, starts the backend first, and then starts the frontend. It also installs the frontend packages if they are not already installed.

On **macOS/Linux**, open a terminal in the project folder and run:

```bash
chmod +x scripts/*.sh
SPRING_PROFILES_ACTIVE=demo bash scripts/start.sh
```

The `chmod` command lets the scripts run. You may need it after downloading and extracting the OneDrive folder.

Keep this terminal open. Press **Ctrl+C** in this terminal to stop both. Once both are running, follow **Open the application** below.

This is a Bash script. For **Windows PowerShell**, use the separate commands below.

### Start them separately

You can also start the backend and frontend in two terminals. Choose this option or the script above; you do not need to run both options.

#### Terminal 1: start the backend in DEMO mode

Open a terminal in the project folder.

**Windows PowerShell:**

```powershell
cd backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=demo"
```

**macOS/Linux:**

```bash
cd backend
sh ./mvnw spring-boot:run -Dspring-boot.run.profiles=demo
```

Leave this terminal open. The first run may take a few minutes to download the Java packages.

#### Terminal 2: start the frontend

Open another terminal in the project folder. The commands are the same for Windows, macOS, and Linux:

```text
cd frontend
npm ci
npm run dev -- --strictPort
```

`npm ci` installs the package versions we use in the project. Use the files we have included in the downloaded folder. You do not need to update the packages.

### Open the application

Open [http://localhost:5173](http://localhost:5173) in your browser. Select DEMO, choose an issue, and click **Run pipeline**.

You should see the steps running. We have included sample issues that ask questions or stop at a check. This is expected.

You can also open [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health). It should show `"status":"UP"`.

If you started them separately, press **Ctrl+C** in both terminals to stop the application. If you used our script, press **Ctrl+C** in its terminal.

## 8. If you will use OpenAI LIVE mode

For LIVE mode, you need an OpenAI API key. Use your own key or one we provide for the session. Check that it can use the required model and has enough API quota. You can follow the [OpenAI API guide](https://developers.openai.com/api/docs/quickstart) to create a key.

Create a text file called **`.env`** in the project folder, next to `README.md`. On Windows, make sure it is not saved as `.env.txt`.

Add this line and replace the placeholder with your key:

```dotenv
OPENAI_API_KEY=replace-with-your-actual-api-key
```

Keep this file private. Do not upload it to OneDrive or share your key in screenshots or Git. Keep your `.env` file on your own laptop.

Stop the DEMO backend. Open a terminal in the project folder and start the backend again using these commands.

If you used our script, stop it with **Ctrl+C** first. On macOS/Linux, you can then run `bash scripts/start.sh` from the project folder to start both in the default OpenAI setup. Otherwise, use the backend commands below and keep the frontend running in its own terminal.

**Windows PowerShell:**

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

**macOS/Linux:**

```bash
cd backend
sh ./mvnw spring-boot:run
```

Keep the frontend running. Refresh the browser, select **LIVE** under **Next run**, and run a new pipeline.

When you start the backend with the `demo` profile, only DEMO is available. Use the commands above to start with OpenAI.

## 9. What is optional?

For the local setup above, you do not need to install Docker, Ollama, PostgreSQL, MySQL, Python, or Maven separately. We use a built-in temporary database for this setup. Its data resets when the backend restarts.

You also do not need real Jira, Confluence, or deployment accounts. We use sample data in the workshop and simulate the deployment.

These tools are only needed if you choose another way to run the project:

| Tool | When it is needed |
| --- | --- |
| Docker and Docker Compose | To run the app in containers. Docker must be running and able to download images. This setup includes PostgreSQL and also uses port 5432. You do not need Java or Node installed on your laptop just to run the containers. |
| Ollama | To use a local AI model instead of OpenAI. You need Ollama running and the model downloaded. The default model is `llama3.1`, and the service uses port 11434. It needs extra memory and disk space. |
| Java extensions for your editor | Helpful when editing Java code during the exercise. They are not required to start the application from a terminal. |

## 10. What we would like you to check before the session

- [ ] You have downloaded the project folder from OneDrive and extracted it if needed.
- [ ] Java 21, Node.js, and npm are installed and the version commands work.
- [ ] You can open the project in your editor.
- [ ] Maven and npm can download the required packages on your network.
- [ ] The backend starts and its health page shows UP.
- [ ] The dashboard opens and you can run a DEMO pipeline.
- [ ] If you are using OpenAI LIVE, your API key is set and a LIVE run works.

If something fails, share your operating system, the command, and the error with us. Remove any API keys before sharing the output.
