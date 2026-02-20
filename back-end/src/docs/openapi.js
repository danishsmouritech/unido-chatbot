export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "UNIDO RAG Backend API",
    version: "1.0.0",
    description: "REST API documentation for chat, admin auth, and admin operations."
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
          email: { type: "string", example: "admin@unido.local" },
          password: { type: "string", example: "Admin@123" }
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
    "/api/admin/analytics": {
      get: {
        tags: ["Admin"],
        summary: "Get admin analytics",
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
    "/api/admin/settings": {
      get: {
        tags: ["Admin"],
        summary: "Get admin settings",
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
