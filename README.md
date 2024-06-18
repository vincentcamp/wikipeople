# WikiPeople.io 📙

WikiPeople.io is a web application leveraging the Wikidata API to search for individuals across various criteria such as birth year, college, and occupation. Designed with flexibility in mind, it offers two distinct modes: Database Mode and Random Mode.

## Features

- **Database Mode**: Retrieves a comprehensive list of individuals from Wikipedia that match all selected criteria, providing a rich database for research and exploration.
- **Random Mode**: Delivers a random Wikipedia profile of an individual meeting the search criteria. Users can cycle through different profiles by selecting 'Next', facilitating serendipitous discovery.

## Usage

- **Home Page**: Select your search criteria, including birth year range, college, and occupation. Choose your mode (Database or Random) and click 'Search'.
- **Database Mode**: View a list of matching profiles based on the criteria.
- **Random Mode**: Explore a random profile matching your criteria. Use the 'Next' button to view another random profile.

## How It Works

WikiPeople.io uses Flask as its web framework and sessions for state management. The application makes queries to the Wikidata API based on user-defined criteria. Here's a brief overview of its operation:

- **Loading Data**: On startup, the app loads occupation and college data from local JSON files.
- **User Interaction**: Through the home page, users submit their search criteria.
- **Query Execution**: Based on the mode, the app constructs and executes SPARQL queries against the Wikidata endpoint.
- **Result Presentation**: The app displays the results in the selected mode, allowing for interactive exploration of Wikipedia profiles.

## Contributing

We welcome contributions to WikiPeople.io! Please feel free to fork the repository, make your changes, and submit a pull request.

## License

This project is licensed under the MIT License - see the LICENSE.md file for details.

## Acknowledgments

- Wikidata API for providing access to their rich database of information.
- Flask and its community for the web framework and extensions used in this project.
