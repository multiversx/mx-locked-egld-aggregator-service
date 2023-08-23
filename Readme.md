### README.md

---

### How to Aggregate Your Data

If you wish to have your data aggregated and made available through this repository:

1. **Fork the Repository**: Click the 'Fork' button at the top right of this repository's page. This will create a copy of this repository in your GitHub account.
2. **Add new project to `AvailableProjects`**: In the `apps/projects/available-projects.ts` file, add a new entry for your project. This will allow to create a new instance of your project's module. Lowercase is recommended for the project name.
3. **Create a new module**: Create a new folder in the `apps/projects` directory. The name of the folder should be lowercase, module should follow the pattern `YOUR_MODULE_NAME.module.ts`, service should be `YOUR_MODULE_NAME.service.ts` and exposed in `index.ts`  This folder will contain all the code for your module.
4. **Implement the Projects Interface**: Ensure you service implements the `ProjectsInterface`. This interface serves as a blueprint for ensuring consistency and integrity of data across all modules.
5. **Testing Your Implementation**: Before submitting a pull request, run the tests to ensure your implementation adheres to expected behaviors:

```bash
npm run test:module --module=YOUR_MODULE_NAME (lowercase reccomended)
```

6. **Submit a Pull Request (PR)**: Once you've made the necessary changes and ensured that your implementation is correct, you can propose these changes to be merged into the main repository. Go to the main page of your forked repository, and click 'New Pull Request'. Fill in the necessary details, and then submit the PR.

### Project Structure and Its Importance

The project's structure is crucial for maintaining order, readability, and scalability of the codebase. By following a standard pattern:

- Developers can quickly understand and navigate the repository.
- It ensures that data aggregation from different sources remains consistent.
- Makes the testing and validation process streamlined.
- It provides a clear roadmap for contributors to follow, leading to a smoother integration process.


## Testing your implementation

### Running Tests

To run the tests for a specific module from `package.json`, use the following command:

```bash
 npm run test:module --module=YOUR_MODULE_NAME
```

Ensure that you replace `YOUR_MODULE_NAME` with the name of your module. Keep in mind that is case sensitive.
