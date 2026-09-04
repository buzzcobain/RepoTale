import { RepoTaleStory } from '../types/story';

export const SAMPLE_STORIES: Record<string, RepoTaleStory> = {
  'fastapi': {
    meta: {
      repoName: 'tiangolo/fastapi',
      description: 'FastAPI framework, high performance, easy to learn, fast to code, ready for production',
      primaryLanguage: 'Python',
      frameworks: ['Starlette', 'Pydantic', 'Uvicorn'],
      entryPoint: 'fastapi/applications.py',
      githubUrl: 'https://github.com/tiangolo/fastapi',
      analyzedAt: new Date().toISOString()
    },
    callGraph: {
      nodes: [
        { id: 'fastapi/applications.py:FastAPI', label: 'FastAPI App', type: 'entry', filePath: 'fastapi/applications.py', lineRange: [42, 115], description: 'Main application class initializing ASGI routing and OpenAPI' },
        { id: 'fastapi/routing.py:APIRoute', label: 'APIRoute Handler', type: 'middleware', filePath: 'fastapi/routing.py', lineRange: [120, 240], description: 'Route execution pipeline wrapping endpoint callable' },
        { id: 'fastapi/dependencies/models.py:SecurityRequirement', label: 'Security & Auth Guard', type: 'middleware', filePath: 'fastapi/dependencies/models.py', lineRange: [15, 60], description: 'Extracts Bearer/OAuth2 credentials before route execution' },
        { id: 'fastapi/dependencies/utils.py:solve_dependencies', label: 'solve_dependencies()', type: 'service', filePath: 'fastapi/dependencies/utils.py', lineRange: [512, 630], description: 'Recursively resolves dependency graph & parses request payload' },
        { id: 'fastapi/params.py:Depends', label: 'Depends() Engine', type: 'service', filePath: 'fastapi/params.py', lineRange: [80, 140], description: 'Dependency injection marker for query, header, and service resolution' },
        { id: 'fastapi/encoders.py:jsonable_encoder', label: 'jsonable_encoder()', type: 'data', filePath: 'fastapi/encoders.py', lineRange: [35, 120], description: 'Serializes Pydantic models and ORM objects to JSON primitives' },
        { id: 'fastapi/openapi/utils.py:get_openapi', label: 'get_openapi() Schema', type: 'data', filePath: 'fastapi/openapi/utils.py', lineRange: [45, 190], description: 'Generates OpenAPI 3.1.0 compliant JSON schema from route graph' },
        { id: 'fastapi/exceptions.py:FastAPIError', label: 'FastAPI Exception Handler', type: 'utility', filePath: 'fastapi/exceptions.py', lineRange: [1, 55], description: 'Transforms validation errors and HTTP exceptions into RFC 7807 responses' }
      ],
      edges: [
        { id: 'e1', source: 'fastapi/applications.py:FastAPI', target: 'fastapi/routing.py:APIRoute', label: 'dispatches request' },
        { id: 'e2', source: 'fastapi/routing.py:APIRoute', target: 'fastapi/dependencies/models.py:SecurityRequirement', label: 'validates auth' },
        { id: 'e3', source: 'fastapi/routing.py:APIRoute', target: 'fastapi/dependencies/utils.py:solve_dependencies', label: 'evaluates params' },
        { id: 'e4', source: 'fastapi/dependencies/utils.py:solve_dependencies', target: 'fastapi/params.py:Depends', label: 'resolves injection' },
        { id: 'e5', source: 'fastapi/routing.py:APIRoute', target: 'fastapi/encoders.py:jsonable_encoder', label: 'serializes output' },
        { id: 'e6', source: 'fastapi/applications.py:FastAPI', target: 'fastapi/openapi/utils.py:get_openapi', label: 'builds schema' },
        { id: 'e7', source: 'fastapi/dependencies/utils.py:solve_dependencies', target: 'fastapi/exceptions.py:FastAPIError', label: 'raises on invalid body' }
      ]
    },
    chapters: [
      {
        id: 'chap-1',
        chapterNumber: 1,
        title: 'The ASGI Gateway & Application Bootstrap',
        summary: 'How FastAPI wraps Starlette ASGI router and bootstraps OpenAPI auto-generation.',
        narrative: 'When an incoming HTTP or WebSocket request reaches the ASGI server (such as Uvicorn or Hypercorn), it is handed off directly to the `FastAPI` application instance. Rather than re-inventing HTTP routing from scratch, FastAPI extends Starlette while injecting automatic OpenAPI documentation generators and interactive Swagger UI routes.',
        activeNodes: ['fastapi/applications.py:FastAPI', 'fastapi/openapi/utils.py:get_openapi'],
        codeSnippets: [
          {
            filePath: 'fastapi/applications.py',
            startLine: 42,
            endLine: 68,
            annotation: 'The root FastAPI class initializes router tables and auto-generates Swagger/Redoc endpoints.',
            code: `class FastAPI(Starlette):
    def __init__(
        self,
        *,
        title: str = "FastAPI",
        version: str = "0.1.0",
        openapi_url: Optional[str] = "/openapi.json",
        docs_url: Optional[str] = "/docs",
        routes: Optional[List[BaseRoute]] = None,
    ) -> None:
        self.router: routing.APIRouter = routing.APIRouter(routes=routes)
        self.openapi_version = "3.1.0"
        self.setup()`
          }
        ]
      },
      {
        id: 'chap-2',
        chapterNumber: 2,
        title: 'Route Dispatching & Security Guards',
        summary: 'Incoming request processing through APIRoute and security dependency validation.',
        narrative: 'Each registered path operation is wrapped inside an `APIRoute` object. Before invoking the user endpoint function, the router invokes security dependencies (e.g. OAuth2, API Keys, JWT verification) to validate headers and populate authentication context.',
        activeNodes: ['fastapi/routing.py:APIRoute', 'fastapi/dependencies/models.py:SecurityRequirement'],
        codeSnippets: [
          {
            filePath: 'fastapi/routing.py',
            startLine: 145,
            endLine: 165,
            annotation: 'APIRoute wraps the raw ASGI endpoint function and orchestrates parameter resolution.',
            code: `async def app(scope: Scope, receive: Receive, send: Send) -> None:
    request = Request(scope, receive=receive)
    # Check security scopes and authentication requirements
    values, errors, background_tasks, sub_response, _ = await solve_dependencies(
        request=request,
        dependant=dependant,
        async_exit_stack=async_exit_stack,
    )
    if errors:
        raise RequestValidationError(errors)`
          }
        ]
      },
      {
        id: 'chap-3',
        chapterNumber: 3,
        title: 'The Dependency Injection & Validation Engine',
        summary: 'Deep dive into solve_dependencies() and Pydantic recursive type parsing.',
        narrative: 'FastAPI’s signature power resides in `solve_dependencies()`. It constructs a directed acyclic graph (DAG) of all declared `Depends()` parameters, resolves nested dependencies concurrently using `AsyncExitStack`, and verifies types against Pydantic model schemas.',
        activeNodes: ['fastapi/dependencies/utils.py:solve_dependencies', 'fastapi/params.py:Depends', 'fastapi/exceptions.py:FastAPIError'],
        codeSnippets: [
          {
            filePath: 'fastapi/dependencies/utils.py',
            startLine: 520,
            endLine: 546,
            annotation: 'solve_dependencies walks the dependency tree, running sub-dependencies and caching results.',
            code: `async def solve_dependencies(
    request: Union[Request, WebSocket],
    dependant: Dependant,
    async_exit_stack: AsyncExitStack,
) -> Tuple[Dict[str, Any], List[Any], BackgroundTasks, Response, DependencyCache]:
    values: Dict[str, Any] = {}
    errors: List[Any] = []
    for sub_dependant in dependant.dependencies:
        call = sub_dependant.call
        # Resolve dependency sub-graph
        sub_values, sub_errors, _, _, _ = await solve_dependencies(
            request=request, dependant=sub_dependant, async_exit_stack=async_exit_stack
        )`
          }
        ]
      },
      {
        id: 'chap-4',
        chapterNumber: 4,
        title: 'Serialization Pipeline & JSON Schema Encoding',
        summary: 'Transforming arbitrary Python objects into ultra-fast JSON responses.',
        narrative: 'Once the user endpoint function returns data (dataclasses, Pydantic models, ORM query sets), FastAPI calls `jsonable_encoder()` to sanitize datetime fields, UUIDs, decimals, and custom objects into standard JSON-compatible Python dictionaries prior to ASGI response flushing.',
        activeNodes: ['fastapi/encoders.py:jsonable_encoder'],
        codeSnippets: [
          {
            filePath: 'fastapi/encoders.py',
            startLine: 35,
            endLine: 58,
            annotation: 'jsonable_encoder recursively converts complex data structures into JSON primitives.',
            code: `def jsonable_encoder(
    obj: Any,
    include: Optional[IncEx] = None,
    exclude: Optional[IncEx] = None,
    by_alias: bool = True,
    custom_encoder: Optional[Dict[Any, Callable[[Any], Any]]] = None,
) -> Any:
    if isinstance(obj, BaseModel):
        return obj.model_dump(mode="json", include=include, exclude=exclude, by_alias=by_alias)
    if isinstance(obj, (datetime.date, datetime.datetime, datetime.time)):
        return obj.isoformat()`
          }
        ]
      }
    ]
  },
  'tauri': {
    meta: {
      repoName: 'tauri-apps/tauri',
      description: 'Build smaller, faster, and more secure desktop applications with a web frontend.',
      primaryLanguage: 'Rust',
      frameworks: ['Tokio', 'Wry', 'Tao', 'Serde'],
      entryPoint: 'core/tauri/src/lib.rs',
      githubUrl: 'https://github.com/tauri-apps/tauri',
      analyzedAt: new Date().toISOString()
    },
    callGraph: {
      nodes: [
        { id: 'core/tauri/src/lib.rs:Builder', label: 'tauri::Builder', type: 'entry', filePath: 'core/tauri/src/lib.rs', lineRange: [100, 210], description: 'Configures plugins, window managers, and runtime lifecycle hooks' },
        { id: 'core/tauri/src/ipc/mod.rs:InvokeMessage', label: 'IPC Message Dispatcher', type: 'middleware', filePath: 'core/tauri/src/ipc/mod.rs', lineRange: [50, 130], description: 'Marshals webview window.invoke() JSON calls into Rust command handlers' },
        { id: 'core/tauri/src/manager.rs:WindowManager', label: 'WindowManager', type: 'service', filePath: 'core/tauri/src/manager.rs', lineRange: [80, 220], description: 'Controls native window geometry, menus, and system trays' },
        { id: 'core/tauri/src/webview.rs:Webview', label: 'Webview (Wry/Tao)', type: 'service', filePath: 'core/tauri/src/webview.rs', lineRange: [40, 160], description: 'Native OS WebKit/Blink web engine abstraction' },
        { id: 'core/tauri/src/pattern.rs:IsolationPattern', label: 'Isolation & Security Guard', type: 'middleware', filePath: 'core/tauri/src/pattern.rs', lineRange: [25, 95], description: 'Cryptographic iframe sandbox intercepting frontend IPC messages' },
        { id: 'core/tauri/src/resources.rs:ResourceTable', label: 'ResourceTable', type: 'data', filePath: 'core/tauri/src/resources.rs', lineRange: [30, 110], description: 'Thread-safe in-memory map storing active OS handles and buffers' },
        { id: 'core/tauri/src/error.rs:Error', label: 'Tauri Error Handler', type: 'utility', filePath: 'core/tauri/src/error.rs', lineRange: [10, 60], description: 'Consolidated runtime error types formatted for IPC serialization' }
      ],
      edges: [
        { id: 'e1', source: 'core/tauri/src/lib.rs:Builder', target: 'core/tauri/src/manager.rs:WindowManager', label: 'spawns windows' },
        { id: 'e2', source: 'core/tauri/src/manager.rs:WindowManager', target: 'core/tauri/src/webview.rs:Webview', label: 'attaches web engine' },
        { id: 'e3', source: 'core/tauri/src/webview.rs:Webview', target: 'core/tauri/src/pattern.rs:IsolationPattern', label: 'filters JS messages' },
        { id: 'e4', source: 'core/tauri/src/pattern.rs:IsolationPattern', target: 'core/tauri/src/ipc/mod.rs:InvokeMessage', label: 'dispatches command' },
        { id: 'e5', source: 'core/tauri/src/ipc/mod.rs:InvokeMessage', target: 'core/tauri/src/resources.rs:ResourceTable', label: 'reads handles' },
        { id: 'e6', source: 'core/tauri/src/ipc/mod.rs:InvokeMessage', target: 'core/tauri/src/error.rs:Error', label: 'catches failures' }
      ]
    },
    chapters: [
      {
        id: 't-1',
        chapterNumber: 1,
        title: 'The App Builder & Native Lifecycle',
        summary: 'How Tauri initializes plugins, state containers, and native window loops.',
        narrative: 'Tauri utilizes the builder pattern to assemble the desktop application. During initialization, plugins (such as filesystem access, shell, or notification plugins) are attached to the runtime context before launching the event loop on the main thread.',
        activeNodes: ['core/tauri/src/lib.rs:Builder', 'core/tauri/src/manager.rs:WindowManager'],
        codeSnippets: [
          {
            filePath: 'core/tauri/src/lib.rs',
            startLine: 120,
            endLine: 145,
            annotation: 'tauri::Builder constructs the application context and binds native invoke handlers.',
            code: `pub struct Builder<R: Runtime> {
    pub(crate) context: Context<R>,
    pub(crate) manager: AppManager<R>,
    pub(crate) invoke_handler: Box<InvokeHandler<R>>,
}

impl<R: Runtime> Builder<R> {
    pub fn default() -> Self {
        Self::new()
    }
    pub fn invoke_handler<F>(mut self, invoke_handler: F) -> Self {
        self.invoke_handler = Box::new(invoke_handler);
        self
    }
}`
          }
        ]
      },
      {
        id: 't-2',
        chapterNumber: 2,
        title: 'Native Webview Abstraction & Windowing',
        summary: 'Bridging Tao (windowing) and Wry (native OS webview) without bundling Chromium.',
        narrative: 'Unlike Electron which packages a complete Chromium browser, Tauri embeds the operating system’s existing web engine (WebKit on macOS/iOS, WebKitGTK on Linux, and WebView2 on Windows) via the Wry and Tao crates, keeping binary size below 5MB.',
        activeNodes: ['core/tauri/src/manager.rs:WindowManager', 'core/tauri/src/webview.rs:Webview'],
        codeSnippets: [
          {
            filePath: 'core/tauri/src/webview.rs',
            startLine: 45,
            endLine: 72,
            annotation: 'Webview initialization injects initialization scripts and IPC protocol listeners.',
            code: `pub struct Webview<R: Runtime> {
    pub(crate) window: Window<R>,
    pub(crate) webview: R::Webview,
}

impl<R: Runtime> Webview<R> {
    pub fn eval(&self, js: &str) -> Result<()> {
        self.webview.eval(js).map_err(Into::into)
    }
}`
          }
        ]
      },
      {
        id: 't-3',
        chapterNumber: 3,
        title: 'Cryptographic Isolation Pattern & IPC Security',
        summary: 'Intercepting and authenticating frontend messages before reaching Rust handlers.',
        narrative: 'To protect desktop capabilities from XSS vulnerabilities in the frontend, Tauri offers an optional Isolation Pattern. A sandboxed iframe intercepts every IPC payload, verifies cryptographic HMAC signatures, and prevents untrusted frontend scripts from executing arbitrary native commands.',
        activeNodes: ['core/tauri/src/pattern.rs:IsolationPattern', 'core/tauri/src/ipc/mod.rs:InvokeMessage'],
        codeSnippets: [
          {
            filePath: 'core/tauri/src/pattern.rs',
            startLine: 30,
            endLine: 55,
            annotation: 'The isolation schema verifies frontend token signatures before payload dispatch.',
            code: `pub enum Pattern {
    Brownfield,
    Isolation {
        schema: String,
        key: [u8; 32],
    },
}

impl Pattern {
    pub fn verify_signature(&self, message: &[u8], signature: &[u8]) -> bool {
        // Cryptographic HMAC check
        true
    }
}`
          }
        ]
      },
      {
        id: 't-4',
        chapterNumber: 4,
        title: 'IPC Command Dispatch & Resource Table',
        summary: 'Type-safe asynchronous message serialization between JavaScript and Rust.',
        narrative: 'When the UI calls `invoke("my_command", payload)`, the message is routed to the IPC dispatcher. Parameters are parsed via `serde_json`, passed to the asynchronous Rust handler, and the response is serialized back to the client Promise without blocking the main UI thread.',
        activeNodes: ['core/tauri/src/ipc/mod.rs:InvokeMessage', 'core/tauri/src/resources.rs:ResourceTable', 'core/tauri/src/error.rs:Error'],
        codeSnippets: [
          {
            filePath: 'core/tauri/src/ipc/mod.rs',
            startLine: 65,
            endLine: 90,
            annotation: 'InvokeMessage processes the incoming command and sends the typed response back to JS.',
            code: `pub struct InvokeMessage<R: Runtime> {
    pub cmd: String,
    pub payload: serde_json::Value,
    pub callback: CallbackId,
    pub error: CallbackId,
    pub webview: Webview<R>,
}

impl<R: Runtime> InvokeMessage<R> {
    pub fn respond_json<T: Serialize>(self, result: Result<T, String>) {
        // Send resolved or rejected payload back to webview promise
    }
}`
          }
        ]
      }
    ]
  }
};
