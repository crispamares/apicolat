import socket
import random

def get_random_port(port_range, max_tries):
    '''
    Return a free port in a range
    
    :param port_range: (int,int) The min and max port numbers
    :param max_tries: The maximum number of bind attempts to make
    :return port: int, the port ready to use
    '''
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    for i in range(max_tries):
        try:
            port = random.randrange(port_range[0], port_range[1])
            s.bind(('127.0.0.1',port))
        except socket.error as e:
            if not e.errno == socket.errno.EADDRINUSE:
                raise
        else:
            s.close()
            return port
    raise Exception("Could not find a free random port.")
    
