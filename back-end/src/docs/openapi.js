export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "UNIDO RAG Backend API",
    version: "1.0.0",
    description:
      "REST API documentation for the UNIDO RAG backend, including public chat endpoints, admin authentication, analytics, settings, scrape controls, and report exports."
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Local development server"
    }
  ],
  tags: [
    { name: "Health" },
    { name: "Chat" },
    { name: "Admin Auth" },
    { name: "Admin" }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string" }
        }
      },
      ChatSessionResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          sessionId: { type: "string", example: "7b8a17c0-93b3-4e6b-8864-2b3d6af7f8d0" }
        }
      },
      ChatAskRequest: {
        type: "object",
        required: ["sessionId", "question"],
        properties: {
          sessionId: { type: "string" },
          question: { type: "string" }
        }
      },
      ChatSource: {
        type: "object",
        properties: {
          id: { type: "string", nullable: true },
          score: { type: "number", nullable: true },
          metadata: { type: "object", additionalProperties: true }
        }
      },
      ChatAskResponse: {
        type: "object",
        properties: {
          answer: { type: "string" },
          sources: {
            type: "array",
            items: { $ref: "#/components/schemas/ChatSource" }
          }
        }
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", example: "admin@your-org.org" },
          password: { type: "string", example: "StrongPassword123!" }
        }
      },
      LoginResponse: {
        type: "object",
        properties: {
          token: { type: "string" },
          admin: {
            type: "object",
            properties: {
              id: { type: "string" },
              username: { type: "string" },
              email: { type: "string" }
            }
          }
        }
      },
      AdminAnalyticsResponse: {
        type: "object",
        properties: {
          conversations: { type: "number" },
          messages: { type: "number" },
          userMessages: { type: "number" },
          assistantMessages: { type: "number" },
          uniqueUsers: { type: "number" },
          avgResponseMs: { type: "number" },
          errors: { type: "number" }
        }
      },
      ChatLog: {
        type: "object",
        properties: {
          _id: { type: "string" },
          sessionId: { type: "string" },
          question: { type: "string" },
          answer: { type: "string" },
          status: { type: "string", enum: ["success", "fallback", "error"] },
          sources: {
            type: "array",
            items: { $ref: "#/components/schemas/ChatSource" }
          },
          requestMeta: {
            type: "object",
            properties: {
              ip: { type: "string", nullable: true },
              userAgent: { type: "string", nullable: true }
            }
          },
          createdAt: { type: "string", format: "date-time" }
        }
      },
      PaginationMetadata: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 25 },
          total: { type: "integer", example: 120 },
          totalPages: { type: "integer", example: 5 },
          hasNext: { type: "boolean" },
          hasPrev: { type: "boolean" }
        }
      },
      AdminSettingsResponse: {
        type: "object",
        properties: {
          systemPrompt: { type: "string" },
          chatbotEnabled: { type: "boolean" },
          lastScrapeAt: { type: "string", format: "date-time", nullable: true }
        }
      },
      AdminSettingsUpdateRequest: {
        type: "object",
        properties: {
          systemPrompt: { type: "string" },
          chatbotEnabled: { type: "boolean" }
        }
      },
      AdminSettingsUpdateResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          settings: { $ref: "#/components/schemas/AdminSettingsResponse" }
        }
      },
      ScrapeStatus: {
        type: "object",
        properties: {
          lastStatus: { type: "string", enum: ["idle", "running", "success", "error"] },
          startedAt: { type: "string", format: "date-time", nullable: true },
          finishedAt: { type: "string", format: "date-time", nullable: true },
          lastError: { type: "string", nullable: true }
        }
      },
      ScrapeTriggerResponse: {
        type: "object",
        properties: {
          started: { type: "boolean" },
          status: { $ref: "#/components/schemas/ScrapeStatus" }
        }
      }
    }
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Service health check",
        description:
          "Returns the runtime health state of the backend service. Use this endpoint for uptime probes, deployment checks, and basic readiness validation before sending user traffic.",
        responses: {
          "200": {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    service: { type: "string", example: "unido-rag-backend" }
                  }
                }
              }
            }
          },
          "500": {
            description: "Service is unhealthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string" },
                    message: { type: "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/chat/visibility": {
      get: {
        tags: ["Chat"],
        summary: "Get chatbot visibility status",
        description:
          "Indicates whether the chatbot is currently enabled for end users. Frontend clients should call this before rendering or activating the chat widget.",
        responses: {
          "200": {
            description: "Chatbot visibility status",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    chatbotEnabled: { type: "boolean" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/chat/session": {
      post: {
        tags: ["Chat"],
        summary: "Create chat session",
        description:
          "Creates and returns a new chat session identifier used to group user messages and assistant answers into one conversation thread. This sessionId must be provided in subsequent /api/chat/ask requests.",
        responses: {
          "201": {
            description: "Session created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ChatSessionResponse" }
              }
            }
          },
          "503": {
            description: "Chatbot disabled",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/chat/ask": {
      post: {
        tags: ["Chat"],
        summary: "Ask a question",
        description:
          "Accepts a user question for a given session, runs retrieval and generation over indexed knowledge, and returns an answer with source metadata when available. Use the same sessionId across turns to preserve context.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ChatAskRequest" }
            }
          }
        },
        responses: {
          "200": {
            description: "Answer returned",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ChatAskResponse" }
              }
            }
          },
          "400": {
            description: "Invalid request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          "404": {
            description: "Session not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          "500": {
            description: "Internal error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          "503": {
            description: "Chatbot disabled",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/admin/auth/login": {
      post: {
        tags: ["Admin Auth"],
        summary: "Admin login",
        description:
          "Authenticates an admin user with email and password credentials. On success, returns a JWT bearer token and admin profile details; include the token in the Authorization header for protected admin endpoints.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" }
            }
          }
        },
        responses: {
          "200": {
            description: "Login success",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginResponse" }
              }
            }
          },
          "401": {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/admin/auth/logout": {
      post: {
        tags: ["Admin Auth"],
        summary: "Admin logout",
        description:
          "Invalidates the current admin authentication context. Clients should call this when ending an admin session and remove the stored bearer token locally after successful logout.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Logout success",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true }
                  }
                }
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/admin/analytics": {
      get: {
        tags: ["Admin"],
        summary: "Get admin analytics",
        description:
          "Returns aggregate operational analytics for admin dashboards, including conversation counts, message volumes, unique-user estimates, response latency, and error totals.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Analytics payload",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AdminAnalyticsResponse" }
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/admin/allInformation": {
      get: {
        tags: ["Admin"],
        summary: "List chat logs",
        description:
          "Returns paginated conversation logs for admin review. Supports filtering by search term across sessionId, question, answer, status, and request IP.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "page",
            schema: { type: "integer", minimum: 1, default: 1 },
            required: false,
            description: "Page number (defaults to 1)."
          },
          {
            in: "query",
            name: "limit",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 25 },
            required: false,
            description: "Page size between 1 and 100 (defaults to 25)."
          },
          {
            in: "query",
            name: "search",
            schema: { type: "string" },
            required: false,
            description: "Case-insensitive search over sessionId, question, answer, status, or IP."
          }
        ],
        responses: {
          "200": {
            description: "Paginated chat logs",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    logs: {
                      type: "array",
                      items: { $ref: "#/components/schemas/ChatLog" }
                    },
                    pagination: { $ref: "#/components/schemas/PaginationMetadata" }
                  }
                }
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/admin/settings": {
      get: {
        tags: ["Admin"],
        summary: "Get admin settings",
        description:
          "Fetches current runtime-configurable settings used by the assistant, including system prompt behavior, chatbot availability toggle, and latest scrape timestamp.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Settings payload",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AdminSettingsResponse" }
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      },
      put: {
        tags: ["Admin"],
        summary: "Update admin settings",
        description:
          "Updates mutable assistant settings. Use this endpoint to change the system prompt and enable or disable chatbot access without redeploying the backend.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AdminSettingsUpdateRequest" }
            }
          }
        },
        responses: {
          "200": {
            description: "Settings updated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AdminSettingsUpdateResponse" }
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          "500": {
            description: "Update failed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/admin/scrape/trigger": {
      post: {
        tags: ["Admin"],
        summary: "Trigger scraping pipeline",
        description:
          "Starts a manual scrape/indexing run for content ingestion. Use this when admins need to refresh knowledge outside scheduled jobs; response includes whether a new run was started and current status metadata.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Scrape trigger response",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ScrapeTriggerResponse" }
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/admin/scrape/status": {
      get: {
        tags: ["Admin"],
        summary: "Get scraping status",
        description:
          "Returns the latest scraping pipeline execution state, including lifecycle timestamps and last known error details for monitoring and troubleshooting.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Scrape status",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ScrapeStatus" }
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/admin/reports/chat-logs": {
      get: {
        tags: ["Admin"],
        summary: "Download chat logs CSV",
        description:
          "Exports chat activity as a CSV file for reporting and audit use cases. Optional filters support date ranges, export type selection, and row limits to control output size.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "startDate",
            schema: { type: "string", format: "date" },
            required: false
          },
          {
            in: "query",
            name: "endDate",
            schema: { type: "string", format: "date" },
            required: false
          },
          {
            in: "query",
            name: "type",
            schema: { type: "string", enum: ["all", "conversations"] },
            required: false
          },
          {
            in: "query",
            name: "limit",
            schema: { type: "integer", minimum: 1, maximum: 10000 },
            required: false
          }
        ],
        responses: {
          "200": {
            description: "CSV file stream",
            content: {
              "text/csv": {
                schema: { type: "string", format: "binary" }
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    }
  }
};
