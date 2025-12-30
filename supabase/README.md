# Supabase Directory

This `supabase/` directory was created by running `supabase init` and contains all configuration and files needed for local Supabase development using the Supabase CLI.

It is safe to commit this directory to version control to share local setup and schema changes.

## Key Files and Folders

#### `config.toml`

The main configuration file for your local Supabase stack. It defines settings for services like database ports, Auth providers, Storage buckets, and more. Edit this file to customize your local environment. Changes require restarting the stack with `supabase stop` and `supabase start`.

#### `migrations/`

Contains SQL migration files that version your database schema changes. Use commands like `supabase db diff` or `supabase migration new` to generate migrations. These are applied locally with `supabase start` or `supabase db reset`, and can be deployed to remote projects.

#### `functions/`

Directory for Supabase Edge Functions (serverless Deno functions). Create functions here with `supabase functions new <name>`. They are served locally when the stack is running and can be deployed to your Supabase project.

## Supabase Studio

Be default, you can view your local Supabase project with Supabase Studio at **[http://localhost:54323](http://localhost:54323).**

## Supabase CLI Docs

For more details, see the [Supabase CLI docs](https://supabase.com/docs/guides/local-development/cli/getting-started).
