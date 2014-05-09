import argparse
import ConfigParser

options = [
    ("zmq_server", dict(default=False, action='store_true', help="Run the ZMQ Server")),
    ("zmq_port", dict(type=int, default=18000, help="The port number of the ZMQ server")),
    ("ws_server", dict(default=False, action='store_true', help="Run the WebSocket Server")),
    ("ws_port", dict(type=int, default=18081, help="The port number of the WebSocket server")),
    ("web_server", dict(default=False, action='store_true', help="Run the Web Server")),
    ("web_port", dict(type=int, default=18080, help="The port number of the Web server")),
    ("use_random_port", dict(default=False, action='store_true', help="Let the system find free ports inside the port range")),
    ("port_max_tries", dict(type=int, default=100, help="Maximum number of port finding attempts to make")),
    ("lower_port", dict(type=int, default=10000, help="The lower port of the range")),
    ("upper_port", dict(type=int, default=20000, help="The upper port of the range"))
]

def parseArgsAndConfig(options, description=None):

    # Turn off help, so we print all options in response to -h
    config_parser = argparse.ArgumentParser(add_help=False)
    config_parser.add_argument("-c", "--config_file",
                               help="Specify configuration file", metavar="FILE")
    args, remaining_argv = config_parser.parse_known_args()
    
    defaults = { k:v['default'] for k, v in options }
        
    if args.config_file:
        config = ConfigParser.SafeConfigParser()
        config.read([args.config_file])
        config_defaults = dict(config.items("Core"))
        
        defaults.update(config_defaults)
            
    # Don't surpress add_help here so it will handle -h
    parser = argparse.ArgumentParser(
        description=self.description,
        # Inherit options from config_parser
        parents=[config_parser],
        # Print default values in the help message
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )

    parser.add_argument('--version', action='version', version='PROGRAM VERSION')
    for option in options:
        parser.add_argument("--"+option[0], **option[1])

    parser.set_defaults(**defaults)

    args = parser.parse_args(remaining_argv)

    return args

